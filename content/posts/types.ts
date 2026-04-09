export interface BlogPostData {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  image_url: string;
  author_name: string;
  category: string;
  is_featured: boolean;
  published_at: string;
  meta_title: string;
  meta_description: string;
  lang: string;
}
