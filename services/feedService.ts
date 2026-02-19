import { supabase } from '../supabase/client';
import type { FeedPost } from '../types/feed';

export const feedService = {
  // Upload image to Supabase Storage
  async uploadImage(file: File, userId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('feed-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('feed-images')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  },

  // Upload multiple images with aggregate progress callback
  async uploadImages(
    files: File[],
    userId: string,
    onProgress?: (percent: number) => void
  ): Promise<string[]> {
    if (!onProgress) {
      const uploadPromises = files.map(file => this.uploadImage(file, userId));
      return Promise.all(uploadPromises);
    }

    // Upload sequentially with per-file progress
    const results: string[] = [];
    for (let i = 0; i < files.length; i++) {
      onProgress(Math.round((i / files.length) * 100));
      const url = await this.uploadImage(files[i], userId);
      results.push(url);
    }

    onProgress(100);
    return results;
  },

  // Delete image from storage
  async deleteImage(imageUrl: string): Promise<boolean> {
    try {
      // Extract path from URL
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/');
      const bucketIndex = pathParts.indexOf('feed-images');
      if (bucketIndex === -1) return false;

      const filePath = pathParts.slice(bucketIndex + 1).join('/');

      const { error } = await supabase.storage
        .from('feed-images')
        .remove([filePath]);

      return !error;
    } catch {
      console.error('Error deleting image');
      return false;
    }
  },

  // Get user's posts
  async getUserPosts(userId: string, page: number = 0, limit: number = 10): Promise<FeedPost[]> {
    const from = page * limit;
    const to = from + limit - 1;

    const { data, error } = await supabase
      .from('feed_posts')
      .select(`
        *,
        author:profiles!author_id (
          id,
          full_name,
          headline,
          avatar_url
        )
      `)
      .eq('author_id', userId)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return data || [];
  },

  // Get single post with details
  async getPost(postId: string): Promise<FeedPost | null> {
    const { data, error } = await supabase
      .from('feed_posts')
      .select(`
        *,
        author:profiles!author_id (
          id,
          full_name,
          headline,
          avatar_url
        )
      `)
      .eq('id', postId)
      .single();

    if (error) return null;
    return data;
  },

  // Get feed statistics
  async getFeedStats(): Promise<{
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    postsToday: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      postsResult,
      likesResult,
      commentsResult,
      todayResult
    ] = await Promise.all([
      supabase.from('feed_posts').select('*', { count: 'exact', head: true }).eq('is_hidden', false),
      supabase.from('feed_likes').select('*', { count: 'exact', head: true }),
      supabase.from('feed_comments').select('*', { count: 'exact', head: true }).eq('is_hidden', false),
      supabase.from('feed_posts').select('*', { count: 'exact', head: true })
        .eq('is_hidden', false)
        .gte('created_at', today.toISOString())
    ]);

    return {
      totalPosts: postsResult.count || 0,
      totalLikes: likesResult.count || 0,
      totalComments: commentsResult.count || 0,
      postsToday: todayResult.count || 0
    };
  },

  // Generate achievement content (bilingual)
  generateAchievementContent(
    type: string,
    data: Record<string, unknown>,
    lang: 'es' | 'en' = 'es'
  ): string {
    const messages: Record<string, { es: string; en: string }> = {
      profile_completed: {
        es: '🎉 ¡He completado mi perfil profesional! Listo para nuevas oportunidades.',
        en: '🎉 I have completed my professional profile! Ready for new opportunities.'
      },
      got_hired: {
        es: `🚀 ¡Emocionante noticia! Acabo de unirme a ${data.company_name} como ${data.position}. ¡Gracias a todos por el apoyo!`,
        en: `🚀 Exciting news! I just joined ${data.company_name} as ${data.position}. Thank you all for the support!`
      },
      stamp_verified: {
        es: `✅ Mi ${data.stamp_type} ha sido verificado. ¡Credenciales confirmadas!`,
        en: `✅ My ${data.stamp_type} has been verified. Credentials confirmed!`
      },
      first_post: {
        es: '👋 ¡Hola comunidad! Esta es mi primera publicación en YourCVPassport.',
        en: '👋 Hello community! This is my first post on YourCVPassport.'
      },
      milestone_experience: {
        es: `🎯 ¡Hito alcanzado! ${data.years} años de experiencia profesional documentada.`,
        en: `🎯 Milestone reached! ${data.years} years of documented professional experience.`
      },
      new_certification: {
        es: `📜 ¡Nueva certificación obtenida! ${data.certification_name}${data.issuer ? ` por ${data.issuer}` : ''}.`,
        en: `📜 New certification obtained! ${data.certification_name}${data.issuer ? ` by ${data.issuer}` : ''}.`
      }
    };

    return messages[type]?.[lang] ?? (lang === 'es' ? '🌟 ¡Nuevo logro desbloqueado!' : '🌟 New achievement unlocked!');
  },

  // Generate poll content (bilingual)
  generatePollContent(
    question: string,
    options: string[],
    lang: 'es' | 'en' = 'es'
  ): string {
    const numbered = options.map((o, i) => `${i + 1}. ${o}`).join('\n');
    const prefix = lang === 'es' ? '📊 Encuesta' : '📊 Poll';
    return `${prefix}: ${question}\n\n${numbered}`;
  },

  // Generate event content (bilingual)
  generateEventContent(
    title: string,
    date: string,
    time?: string,
    location?: string,
    lang: 'es' | 'en' = 'es'
  ): string {
    const parts = [`📅 ${title}`, `🗓️ ${date}${time ? ` · ${time}` : ''}`];
    if (location) parts.push(`📍 ${location}`);
    return parts.join('\n');
  },

  // Create achievement post
  async createAchievementPost(
    userId: string,
    achievementType: string,
    achievementData: Record<string, unknown>,
    lang: 'es' | 'en' = 'es'
  ): Promise<FeedPost | null> {
    const content = this.generateAchievementContent(achievementType, achievementData, lang);

    const { data, error } = await supabase
      .from('feed_posts')
      .insert({
        author_id: userId,
        content,
        content_type: 'ACHIEVEMENT',
        achievement_type: achievementType,
        achievement_data: achievementData
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating achievement post:', error);
      return null;
    }

    return data;
  }
};
