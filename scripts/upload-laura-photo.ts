/**
 * Script to upload Laura Martínez Vidal's profile photo to Supabase
 *
 * This script uploads the profile photo and updates the profile with the photo URL
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Supabase configuration
const supabaseUrl = 'https://djehzlzombqrzzuchcef.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZWh6bHpvbWJxcnp6dWNoY2VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDA2NDQsImV4cCI6MjA3NjE3NjY0NH0.gJ4HLmtwuVfGrMr3MgovtfG7Jjk-sqsiKs6Ota_Y4Dw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const PROFILE_ID = 'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e';
const IMAGE_PATH = './laura-martinez-photo.jpg'; // Update this path to your image location

async function uploadProfilePhoto() {
  try {
    console.log('📸 Starting profile photo upload for Laura Martínez Vidal...');

    // Check if image file exists
    if (!fs.existsSync(IMAGE_PATH)) {
      console.error(`❌ Image file not found at: ${IMAGE_PATH}`);
      console.log('Please place the profile photo in the script directory and update IMAGE_PATH');
      return;
    }

    // Read the image file
    const imageFile = fs.readFileSync(IMAGE_PATH);
    const fileName = `${PROFILE_ID}_${Date.now()}.jpg`;
    const filePath = `avatars/${fileName}`;

    console.log(`📤 Uploading photo to: ${filePath}`);

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(filePath, imageFile, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      return;
    }

    console.log('✅ Photo uploaded successfully!');

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('profiles')
      .getPublicUrl(filePath);

    const photoUrl = urlData.publicUrl;
    console.log(`🔗 Public URL: ${photoUrl}`);

    // Update profile with photo URL
    console.log('💾 Updating profile with photo URL...');

    const { data: updateData, error: updateError } = await supabase
      .from('profiles')
      .update({
        photo_url: photoUrl,
        avatar_url: photoUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', PROFILE_ID);

    if (updateError) {
      console.error('❌ Profile update error:', updateError);
      return;
    }

    console.log('✅ Profile updated successfully!');
    console.log('\n🎉 Complete! Laura Martínez Vidal\'s profile photo has been uploaded and linked.');
    console.log(`View profile: ${supabaseUrl}/dashboard/project/djehzlzombqrzzuchcef/editor/profiles?filter=id%3Deq%3D${PROFILE_ID}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
uploadProfilePhoto();
