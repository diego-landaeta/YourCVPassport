/**
 * Test Configuration Helper
 * Provides Supabase credentials and test data for edge function tests
 */

// Get Supabase credentials from environment or use defaults
export const getSupabaseConfig = () => {
  // Try to get from environment variables
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    
    
    
    
    
  }

  return {
    url: url || 'http://localhost:54321',
    anonKey: key || '',
  };
};

// Test data
export const TEST_DATA = {
  email: 'nangelm.dev@gmail.com',
  phone: '+584129543569',
  testUserId: 'test-user-id-' + Date.now(),
};

// Helper to check if edge functions are deployed
export const checkEdgeFunctionsDeployed = async (supabaseUrl: string) => {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/sitemap`);
    return response.status !== 404;
  } catch {
    return false;
  }
};
