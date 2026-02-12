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

  // Upload multiple images
  async uploadImages(files: File[], userId: string): Promise<string[]> {
    const uploadPromises = files.map(file => this.uploadImage(file, userId));
    return Promise.all(uploadPromises);
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
      { count: totalPosts },
      { count: totalLikes },
      { count: totalComments },
      { count: postsToday }
    ] = await Promise.all([
      supabase.from('feed_posts').select('*', { count: 'exact', head: true }),
      supabase.from('feed_likes').select('*', { count: 'exact', head: true }),
      supabase.from('feed_comments').select('*', { count: 'exact', head: true }),
      supabase.from('feed_posts').select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString())
    ]);

    return {
      totalPosts: totalPosts || 0,
      totalLikes: totalLikes || 0,
      totalComments: totalComments || 0,
      postsToday: postsToday || 0
    };
  },

  // Generate achievement content
  generateAchievementContent(
    type: string,
    data: Record<string, unknown>
  ): string {
    switch (type) {
      case 'profile_completed':
        return '🎉 ¡He completado mi perfil profesional! Listo para nuevas oportunidades.';
      case 'got_hired':
        return `🚀 ¡Emocionante noticia! Acabo de unirme a ${data.company_name} como ${data.position}. ¡Gracias a todos por el apoyo!`;
      case 'stamp_verified':
        return `✅ Mi ${data.stamp_type} ha sido verificado. ¡Credenciales confirmadas!`;
      case 'first_post':
        return '👋 ¡Hola comunidad! Esta es mi primera publicacion en YourCVPassport.';
      case 'milestone_experience':
        return `🎯 ¡Hito alcanzado! ${data.years} años de experiencia profesional documentada.`;
      case 'new_certification':
        return `📜 ¡Nueva certificacion obtenida! ${data.certification_name}${data.issuer ? ` por ${data.issuer}` : ''}.`;
      default:
        return '🌟 ¡Nuevo logro desbloqueado!';
    }
  },

  // Create achievement post
  async createAchievementPost(
    userId: string,
    achievementType: string,
    achievementData: Record<string, unknown>
  ): Promise<FeedPost | null> {
    const content = this.generateAchievementContent(achievementType, achievementData);

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
