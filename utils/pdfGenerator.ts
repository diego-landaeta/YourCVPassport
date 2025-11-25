/**
 * PDF Generator Utility
 *
 * Generates PDF from CV using html2canvas and jspdf
 * Downloads the PDF file directly without print dialog
 */

interface PDFGeneratorOptions {
  profileSlug: string;
  profileId: string;
  fileName?: string;
  onProgress?: (progress: number) => void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Generate PDF from CV by loading it in a hidden iframe and capturing with html2canvas
 * Downloads the PDF file directly
 */
export async function generateCVPDF(options: PDFGeneratorOptions): Promise<void> {
  const { profileSlug, profileId, fileName, onProgress, onSuccess, onError } = options;

  try {
    // Dynamic imports to reduce bundle size
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf')
    ]);

    if (onProgress) onProgress(10);

    // Construct CV URL
    const cvUrl = `${window.location.origin}/cv/${profileSlug || profileId}`;

    if (onProgress) onProgress(20);

    // Create hidden iframe to load the CV
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = '1200px';
    iframe.style.height = '1600px';
    document.body.appendChild(iframe);

    // Load CV in iframe
    await new Promise<void>((resolve, reject) => {
      iframe.onload = () => {
        setTimeout(() => resolve(), 2000); // Wait for all content to render
      };
      iframe.onerror = () => reject(new Error('Failed to load CV'));
      iframe.src = cvUrl;
    });

    if (onProgress) onProgress(40);

    // Get iframe document
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      throw new Error('Cannot access iframe content');
    }

    // Force light theme by removing dark mode classes
    const html = iframeDoc.documentElement;
    html.classList.remove('dark');
    iframeDoc.body.classList.remove('dark');
    iframeDoc.body.style.backgroundColor = '#ffffff';

    // Remove dark mode from all child elements
    const allElements = iframeDoc.querySelectorAll('*');
    allElements.forEach((el: any) => {
      el.classList.remove('dark');
    });

    // Find the CV template container (without header/footer navigation)
    const cvContainer = iframeDoc.querySelector('.cv-template');
    if (!cvContainer) {
      throw new Error('CV template container not found');
    }

    // Only hide floating buttons and external navigation (not CV content)
    const floatingButtons = iframeDoc.querySelectorAll('button[class*="fixed"], button[class*="floating"]');
    floatingButtons.forEach((el: any) => {
      el.style.display = 'none';
    });

    // Hide the "own profile" message that shows for logged-in users
    const ownProfileMessages = iframeDoc.querySelectorAll('[class*="bg-blue-50"]');
    ownProfileMessages.forEach((el: any) => {
      const text = el.textContent || '';
      if (text.includes('Este es tu perfil') || text.includes('This is your profile')) {
        el.style.display = 'none';
      }
    });

    // Wait for styles to settle after removing dark classes
    await new Promise(resolve => setTimeout(resolve, 500));

    // Create a wrapper to include CV and footer
    const wrapper = iframeDoc.createElement('div');
    wrapper.style.backgroundColor = '#ffffff';
    wrapper.style.padding = '0';
    wrapper.style.margin = '0';
    wrapper.style.width = '100%';
    wrapper.style.minHeight = '100vh';

    // Clone CV content FIRST
    const cvClone = cvContainer.cloneNode(true) as HTMLElement;

    // FIX: html2canvas has issues with bg-clip-text and text-transparent
    // It renders the background gradient as a solid block or makes text invisible.
    // We must replace gradient text with solid color for PDF export.
    const gradientTextElements = cvClone.querySelectorAll('.text-transparent, .bg-clip-text');
    gradientTextElements.forEach((el: any) => {
      el.classList.remove('text-transparent', 'bg-clip-text');
      el.style.backgroundImage = 'none';
      el.style.background = 'transparent';
      el.style.webkitTextFillColor = 'initial';
      el.style.color = '#111827'; // Force dark color for visibility on white background
    });

    // NOW modify the CLONED header to remove dark elements
    const clonedHeaders = cvClone.querySelectorAll('header');
    clonedHeaders.forEach((header: any) => {
      // Force white background
      header.style.background = 'white';
      header.style.backgroundImage = 'none';
      header.style.backgroundColor = 'white';

      // Find and remove the gradient overlay divs (first two divs in header)
      const allDivs = Array.from(header.querySelectorAll('div'));
      allDivs.forEach((div: any, index: number) => {
        // Remove first 2 divs (they are the gradient overlays)
        if (index < 2 && div.classList.contains('absolute')) {
          div.remove();
        }
      });

      // Add contact information directly in the header
      const profileUrl = `${window.location.origin}/cv/${profileSlug || profileId}`;
      const contactInfo = iframeDoc.createElement('div');
      contactInfo.style.marginTop = '16px';
      contactInfo.style.padding = '12px 16px';
      contactInfo.style.backgroundColor = '#f0f9ff';
      contactInfo.style.border = '1px solid #bfdbfe';
      contactInfo.style.borderRadius = '8px';
      contactInfo.style.fontSize = '13px';
      contactInfo.style.color = '#1e40af';
      contactInfo.style.textAlign = 'center';
      contactInfo.innerHTML = `
        <strong style="font-size: 13px; display: block; margin-bottom: 4px;">📧 Contact Information</strong>
        <span style="color: #64748b; font-size: 12px;">Visit: <a href="${profileUrl}" style="color: #2563eb; font-weight: 600; text-decoration: none;">${profileUrl}</a></span>
      `;

      // Find the main content div inside header and append contact info
      const headerContent = header.querySelector('div.max-w-6xl') || header.querySelector('div.relative');
      if (headerContent) {
        headerContent.appendChild(contactInfo);
      }
    });

    wrapper.appendChild(cvClone);

    // Add footer with "Powered by YourCVPassport"
    const footer = iframeDoc.createElement('div');
    footer.style.textAlign = 'center';
    footer.style.padding = '16px';
    footer.style.fontSize = '11px';
    footer.style.color = '#666666';
    footer.style.backgroundColor = '#f9fafb';
    footer.style.borderTop = '1px solid #e5e7eb';
    footer.innerHTML = 'Powered by <strong style="color: #2563eb;">YourCVPassport</strong>';
    wrapper.appendChild(footer);

    // Clear body and add only our wrapper
    iframeDoc.body.innerHTML = '';
    iframeDoc.body.appendChild(wrapper);

    if (onProgress) onProgress(50);

    // Wait a bit more for styles to apply
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate canvas from wrapper element with optimized settings
    const canvas = await html2canvas(wrapper, {
      scale: 2, // Higher quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1200,
      windowHeight: wrapper.scrollHeight,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
      allowTaint: true,
      foreignObjectRendering: false
    });

    if (onProgress) onProgress(70);

    // Calculate dimensions for A4
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm

    // Calculate image dimensions maintaining aspect ratio
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    // Convert canvas to image
    const imgData = canvas.toDataURL('image/png', 1.0);

    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    // Add additional pages if content is longer
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    // Cleanup
    document.body.removeChild(iframe);

    if (onProgress) onProgress(90);

    // Generate filename
    const pdfFileName = fileName || `CV-${profileSlug || profileId}-${new Date().toISOString().split('T')[0]}.pdf`;

    // Save PDF
    pdf.save(pdfFileName);

    if (onProgress) onProgress(100);

    // Call success callback
    if (onSuccess) {
      onSuccess();
    }

  } catch (error) {
    console.error('Error generating PDF:', error);
    if (onError) {
      onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}

/**
 * Alternative: Generate PDF using html2canvas + jspdf
 * This generates a real PDF file that downloads automatically
 * Note: This requires the CV to be rendered in the current page
 */
export async function generateCVPDFDirect(elementId: string, fileName: string): Promise<void> {
  // Dynamic import to reduce bundle size
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf')
  ]);

  // Get the element to convert
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  // Generate canvas from HTML
  const canvas = await html2canvas(element, {
    scale: 2, // Higher quality
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff'
  });

  // Calculate dimensions
  const imgWidth = 210; // A4 width in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  // Create PDF
  const pdf = new jsPDF({
    orientation: imgHeight > imgWidth ? 'portrait' : 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Add image to PDF
  const imgData = canvas.toDataURL('image/png');
  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

  // Save PDF
  pdf.save(fileName);
}
