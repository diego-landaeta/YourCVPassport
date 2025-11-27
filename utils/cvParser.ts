export interface ParsedCVData {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  headline?: string;
  skills?: string[];
  experiences?: Array<{
    title: string;
    company: string;
    startDate: string;
    endDate?: string;
    description: string;
  }>;
  education?: Array<{
    degree: string;
    institution: string;
    fieldOfStudy?: string;
    startDate: string;
    endDate?: string;
  }>;
  languages?: Array<{
    name: string;
    proficiency?: string;
  }>;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
}

/**
 * Extract text from CV file using FileReader
 * Note: This is a simplified version that works in the browser
 * For production, consider using a backend service for better parsing
 */
export async function extractTextFromCV(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        // Basic text extraction - in production, use proper PDF/DOCX parsers
        resolve(text || file.name);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Parse CV text using OpenAI to extract structured data
 */
export async function parseCVWithAI(cvText: string): Promise<ParsedCVData> {
  const apiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `
You are a CV/Resume parser. Extract the following information from the CV text below and return it as a JSON object.

Required fields:
- fullName: string (person's full name)
- email: string (email address)
- phone: string (phone number)
- location: string (city, country)
- summary: string (professional summary or objective)
- headline: string (professional title or headline)
- skills: array of strings (technical and soft skills)
- experiences: array of objects with:
  - title: string (job title)
  - company: string (company name)
  - startDate: string (YYYY-MM format)
  - endDate: string (YYYY-MM format, or null if current)
  - description: string (job responsibilities and achievements)
- education: array of objects with:
  - degree: string (degree name)
  - institution: string (university/school name)
  - fieldOfStudy: string (major/field)
  - startDate: string (YYYY-MM format)
  - endDate: string (YYYY-MM format)
- languages: array of objects with:
  - name: string (language name)
  - proficiency: string (e.g., "Native", "Fluent", "Intermediate")
- linkedinUrl: string (LinkedIn profile URL)
- githubUrl: string (GitHub profile URL)
- portfolioUrl: string (personal website or portfolio URL)

If a field is not found in the CV, omit it or set it to null.

CV Text:
${cvText}

Return ONLY the JSON object, no additional text.
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a professional CV parser that extracts structured data from resumes. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse the JSON response
    const parsedData: ParsedCVData = JSON.parse(content);
    
    return parsedData;
  } catch (error) {
    
    throw new Error('Failed to parse CV. Please try again or enter your information manually.');
  }
}

/**
 * Main function to parse a CV file
 * Note: This is a simplified version for demo purposes
 * In production, implement proper PDF/DOCX parsing on the backend
 */
export async function parseCV(file: File): Promise<ParsedCVData> {
  try {
    // For now, return mock data based on file name
    // In production, send file to backend for proper parsing
    const fileName = file.name.toLowerCase();
    
    // Simulate parsing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Return mock parsed data
    return {
      fullName: 'Professional User',
      headline: 'Experienced Professional',
      summary: 'Highly skilled professional with extensive experience in the field. Proven track record of delivering results and exceeding expectations.',
      skills: ['Leadership', 'Project Management', 'Communication', 'Problem Solving', 'Team Collaboration'],
      experiences: [
        {
          title: 'Senior Position',
          company: 'Leading Company',
          startDate: '2020-01',
          endDate: null,
          description: 'Led major initiatives and drove significant improvements in team performance and project delivery.'
        },
        {
          title: 'Mid-Level Position',
          company: 'Previous Company',
          startDate: '2017-06',
          endDate: '2019-12',
          description: 'Managed key projects and contributed to organizational growth through innovative solutions.'
        }
      ],
      education: [
        {
          degree: 'Bachelor\'s Degree',
          institution: 'University',
          fieldOfStudy: 'Professional Field',
          startDate: '2013-09',
          endDate: '2017-06'
        }
      ]
    };
  } catch (error) {
    
    throw error;
  }
}
