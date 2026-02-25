-- ============================================================
-- DISABLE MESSAGES FOR ALL DEMO + STAFF PROFILES
-- Feb 26, 2026
-- Sets is_open_to_messages = false for:
--   1. All 40 seed demo profiles (tutors, educators, therapists, etc.)
--   2. Staff / admin / support accounts
-- These are NOT real users — they should never receive messages.
-- ============================================================

-- ── 1. All seed demo profiles ──
UPDATE profiles
SET is_open_to_messages = false
WHERE id IN (
  -- Spanish professionals
  'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e', -- Laura Martínez Vidal
  'a826c47c-0d50-47da-aab3-4dfb71da709d', -- Javier Torres Gimeno
  'e379dca2-0b33-45b4-864a-ba9204e0ab4b', -- Marta Ruiz Serrano
  -- English educators / specialists
  '8d93820f-beb7-4eb8-8a3c-8e7efa6a6665', -- James Wilson (SEL)
  'a2b0d3d3-488f-429a-9b2f-a4e0a78e55a9', -- Sarah Bennett (Montessori/Waldorf)
  '9a3e27d1-f1da-49cb-bb95-cf29319df39c', -- Robert Green (Permaculture)
  '8343e9aa-cc89-4273-9386-581883592a67', -- Marcus Williams (Psychodrama)
  '97d188d3-a038-4726-bb7e-59e13814123a', -- Lisa Morrison (Art Therapist)
  '2ac9f2e0-0293-4fae-a4f0-af388f32cedf', -- Michael Thompson (Addiction)
  '0da0dcfa-82dc-43df-a5f8-adaee989c690', -- Jennifer Martinez (Family Systems)
  '3f40d45b-ad4e-43a9-a88b-a822a56cc7d3', -- Rachel Stevens (Dietitian)
  '206de10c-1322-491b-ac79-c4de3886ca0d', -- David Chen (Mindful Eating)
  'c9e55b0e-efff-4f43-b0ce-3d99868ce3d8', -- Emily Harper (Ecopsychology)
  '3d0d18fd-2b12-4fd5-b5c4-b6635fa3f52e', -- Amanda Rodriguez (Leadership)
  '86a7ec23-2fe8-4a60-afe3-45e61e906b54', -- Kevin Park (Entrepreneurship)
  'e4f2dcf3-6264-46d0-970c-65592c87a9c4', -- Margaret Sullivan (Contemplative)
  'c2eec942-9fb8-4bc5-a208-db9958438d51', -- Thomas Rivera (Perennial Philosophy)
  'e23b0890-fb78-4ab5-85fc-613e56b68aba', -- Patricia Coleman (Qualitative Research)
  'd0961de8-508e-4870-864e-65b833bfafb0', -- Daniel Foster (Research/Data)
  '8068213e-0e53-48c7-b9f5-ccd631865484', -- Linda Zhang (Acupuncture/TCM)
  'efb2e93a-1ad5-4f0d-a948-daa763d5a2d4', -- Priya Sharma (Ayurveda)
  'c0cde1c6-9391-4e6e-933c-d29332068a01', -- Christopher Barnes (Movement/Somatic)
  '43d2d0bd-e9fa-4c54-8f60-3f014121841e', -- Elizabeth Morgan (End-of-Life)
  '9c5139ed-3d1d-49c9-9eba-69d88b6f4e19', -- Richard Hamilton (Grief)
  '11ff7f82-a2dd-4499-aea6-c10ee3dee219', -- Maria Gonzalez (Family Therapy)
  'ddc5f45f-f707-4f37-a90d-c7ec2ea0ba98', -- Janet Lee (Gerontology)
  '83de70ef-0504-4f9d-b45c-d1f35eef9535', -- Steven Mitchell (Transpersonal)
  'c1889bbe-f828-41dc-83f6-b844f1e74d49', -- Angela Roberts (Life Design)
  'dab1878e-f2dc-451c-9753-392c91ac4aa3', -- Brian Cooper (EFT)
  '54701b32-af6e-4923-846d-8a04fad249a8', -- Rebecca Anderson (Naturopathic)
  '0bfd1ef4-c6b0-451c-8637-77b534e6e9a1', -- Karen White (Nutritionist)
  '36c177f5-19f4-47c7-85c7-05507347e702', -- Paul Henderson (Herbalist)
  '55333d11-13c8-43b8-942b-cb1e75d0b812', -- Jessica Porter (Biofeedback)
  '099840cc-a99c-480d-8fd9-fba5ecd5a4a6', -- Alex Martinez (AI in Healthcare)
  '636e9e4d-4873-4114-8949-376a8d0f24bc', -- Diana Russell (Massage)
  '9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da', -- Robert Kim (Acupressure)
  'ce98b4d3-9e58-4f38-98be-8e4fd94d6b15', -- Catherine Adams (LMFT)
  '707aa7e3-b891-485c-b4e6-618625713565', -- Mark Davidson (NVC)
  '7fe0c1a6-39ed-46ad-9388-116a3a0fb429', -- Michelle Chang (Reiki)
  '1b90b431-de09-4b75-af6a-c94975b68746'  -- Nicole Taylor (Dance/Movement)
);

-- ── 2. Staff / support / admin accounts ──
UPDATE profiles
SET is_open_to_messages = false
WHERE slug = 'support-yourcvpassport-com'
   OR role = 'admin';
