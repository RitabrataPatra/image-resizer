export type PresetType = 'photo' | 'signature';

export interface ImagePreset {
  slug: string;
  type: PresetType;
  name: string;
  title: string;
  seoTitle?: string;
  seoDescription?: string;
  description: string;
  h1: string;
  intro: string;
  sourceUrl?: string;
  sourceName?: string;
  lastVerified?: string;
  faqs: { q: string; a: string }[];
  howToUse?: string[];
  practicalTips?: string[];
  limitations?: string;
  relatedLinks?: { label: string; href: string }[];
  width?: number;
  height?: number;
  minKB: number;
  maxKB: number;
  widthCm?: number;
  heightCm?: number;
  dpi?: number;
  published?: boolean;
  showAsButton?: boolean;
}

export const PRESETS: ImagePreset[] = [
  {
    slug: 'photo-50-kb',
    type: 'photo',
    name: 'Photo 50 KB',
    title: 'Photo 50 KB',
    seoTitle: 'Resize Photo to 50 KB: Free, No Upload',
    seoDescription:
      'Work toward a 30–50 KB photo target in your browser. Check the destination’s file-size requirements and review the JPG output.',
    description:
      'Use this 30–50 KB preset when a form or service gives you a photo file-size limit in this range. Check that destination’s requirements before exporting.',
    h1: 'Resize Photo to 50 KB',
    intro:
      'This ExactSpec preset starts with a 30–50 KB target range. Use it when a particular form, portal, or service gives you a file-size limit that fits; its requirements may differ. File size in KB, pixel dimensions, and JPEG quality are related but distinct.',
    faqs: [
      {
        q: 'Why is my image still above 50 KB?',
        a: 'The tool selects JPEG quality to work toward the range, but some images may not reach it at their current dimensions. Try smaller pixel dimensions or adjust the target range only if the destination allows it.',
      },
      {
        q: 'Does reducing dimensions lower file size?',
        a: 'Fewer pixels can reduce the amount of image data, though the result also depends on the image content and JPEG compression.',
      },
      {
        q: 'Will compressing a photo reduce its quality?',
        a: 'JPEG compression is lossy. A smaller file may have less visible detail, so inspect the output and avoid reducing the file more than the destination requires.',
      },
      {
        q: 'Is 50 KB required for every application?',
        a: 'No. This is an ExactSpec preset target, not a universal requirement. Follow the current file-size and image instructions for your specific destination.',
      },
    ],
    howToUse: [
      'Upload a JPG or PNG image.',
      'Crop the image if needed, then review the output preview and file size.',
      'If the file is too large, try reducing its pixel dimensions. ExactSpec selects JPEG quality automatically.',
      'Download the resulting JPG and check it against the destination’s requirements.',
    ],
    practicalTips: [
      'Keep the details important to your use case visible in the crop.',
      'Avoid shrinking dimensions or file size more than necessary; both can reduce visible detail.',
      'Cropping away unused image area can change the output, but does not guarantee a particular KB value.',
    ],
    limitations:
      'ExactSpec works toward the selected range but cannot guarantee that every source image will fit while retaining the quality you want. Always inspect the final JPG.',
    relatedLinks: [
      { label: 'Home image resizer', href: '/' },
      { label: 'All published size presets', href: '/all-sizes/' },
      {
        label: 'Passport-size photo preset',
        href: '/passport-size-photo-35x45-mm/',
      },
    ],
    minKB: 30,
    maxKB: 50,
    published: true,
    showAsButton: true,
  },
  {
    slug: 'passport-size-photo-35x45-mm',
    type: 'photo',
    name: 'Passport Size Photo 35 x 45 mm',
    title: 'Passport Size Photo 35 x 45 mm',
    seoTitle: 'Passport Size Photo 35 x 45 mm',
    seoDescription:
      'Resize a portrait photo to 35 × 45 mm (3.5 × 4.5 cm) with configurable pixel and file-size targets. Check your application’s current photo rules.',
    description:
      'A starting configuration for a 35 × 45 mm portrait crop. Photo requirements vary by application and submission context; check the current instructions for your destination.',
    h1: 'Resize Passport Size Photo 35 x 45 mm',
    intro:
      'This preset helps resize a portrait photo to 35 × 45 mm (3.5 × 4.5 cm). Passport Seva’s current instructions specify a 4.5 cm length × 3.5 cm width colour photograph for certain submission or collection centres, while photographs are not required for applications submitted at PSK/POPSK in that instruction context. Check the current requirements for your specific application.',
    faqs: [
      {
        q: 'What does 35 × 45 mm mean?',
        a: 'It describes physical dimensions: 35 mm wide by 45 mm high. Whether that size is appropriate depends on the destination’s instructions.',
      },
      {
        q: 'How do 35 × 45 mm and pixels relate?',
        a: 'Millimetres describe physical size, while pixels describe digital dimensions. DPI provides a relationship between them. At 300 DPI, 35 × 45 mm converts to approximately 413 × 531 pixels after rounding; these are this preset’s starting values, not an official pixel specification.',
      },
      {
        q: 'Does 35 × 45 mm meet every passport or visa requirement?',
        a: 'No. Requirements vary by country, organization, application, and submission location. The crop ratio alone does not establish the required face size, position, background, or expression. Check the current rules for your destination.',
      },
      {
        q: 'Can I adjust the crop?',
        a: 'Yes. The preset starts with a portrait crop ratio, and you can reposition or adjust the crop window. The ratio does not automatically ensure that the portrait follows a particular application’s framing rules.',
      },
      {
        q: 'Does 300 DPI guarantee that my application will accept the photo?',
        a: 'No. DPI is used with physical-size inputs to calculate pixel dimensions in ExactSpec. The exported JPG is not guaranteed to contain 300-DPI metadata, and acceptance depends on the destination’s full requirements.',
      },
    ],
    howToUse: [
      'Check whether your destination asks for a 35 × 45 mm photo and note any separate framing or file-size rules.',
      'Upload a JPG or PNG and adjust the portrait crop to suit those instructions.',
      'Review the pixel dimensions and 30–80 KB target, changing them if the destination specifies different values.',
      'Download the JPG and verify it against the current destination requirements.',
    ],
    practicalTips: [
      '35 × 45 mm describes physical size; pixels describe the digital image size. DPI relates the two and is used here to calculate pixels.',
      'The 35:45 ratio controls crop shape only. It does not set the required face size, head position, background, or expression.',
      'Use the preset’s 413 × 531 px and 300 DPI values as a starting configuration, not as official Passport Seva pixel or DPI requirements.',
    ],
    limitations:
      'The preset does not guarantee compliance or acceptance. Passport Seva instructions vary by submission context, and other countries, organizations, visas, and applications may set different requirements. ExactSpec uses physical-size and DPI inputs to calculate pixel dimensions; it does not guarantee DPI metadata in the exported JPG.',
    relatedLinks: [
      { label: 'Home image resizer', href: '/' },
      { label: 'All published size presets', href: '/all-sizes/' },
      { label: 'Photo 50 KB preset', href: '/photo-50-kb/' },
    ],
    sourceUrl:
      'https://passportindia.gov.in/pdf/ApplicationformInstructionBooklet-V3.0.pdf',
    sourceName: 'Passport Seva application instruction booklet',
    width: 413,
    height: 531,
    minKB: 30,
    maxKB: 80,
    widthCm: 3.5,
    heightCm: 4.5,
    dpi: 300,
    published: true,
    showAsButton: true,
  },
  {
    slug: 'government-exam-photo-50-kb',
    type: 'photo',
    name: 'Government Exam Photo 50 KB',
    title: 'Government Exam Photo 50 KB',
    seoTitle: 'Government Exam Photo 50 KB',
    seoDescription:
      'Resize a government exam or application photo to about 50 KB in your browser with no upload needed.',
    description:
      'Resize a photo for government exams, application portals, and admission forms that expect a compact 50 KB image.',
    h1: 'Resize Government Exam Photo 50 KB',
    intro:
      'This preset is useful for exam forms, recruitment portals, and government submissions where a compact photo size is required.',
    faqs: [
      {
        q: 'Why use this for exam forms?',
        a: 'Many government application forms ask for a small, clear photo that remains inside a defined KB range.',
      },
      {
        q: 'Can I use a different size if the form allows it?',
        a: 'Yes. Adjust the width and height inside the tool to fit the exact form requirement while keeping the same overall workflow.',
      },
    ],
    minKB: 30,
    maxKB: 50,
    published: false,
    showAsButton: false,
  },
  {
    slug: 'background-verification-photo-50-kb',
    type: 'photo',
    name: 'Background Verification Photo 50 KB',
    title: 'Background Verification Photo 50 KB',
    seoTitle: 'Background Verification Photo 50 KB',
    seoDescription:
      'Resize a background verification or HR photo to a compact 50 KB target in your browser.',
    description:
      'Resize a photo for background verification, employer onboarding, and HR compliance forms that expect a small file size.',
    h1: 'Resize Background Verification Photo 50 KB',
    intro:
      'Use this preset when an employer, verifier, or onboarding portal asks for a compressed but clear photo for background checks and ID records.',
    faqs: [
      {
        q: 'Is this meant for HR documents?',
        a: 'Yes. It is useful for employer onboarding, verification documents, and compliance submissions that restrict the final image size.',
      },
      {
        q: 'Will this maintain a clear face crop?',
        a: 'Yes, the browser crop and quality controls let you keep the face centered while staying within the target KB range.',
      },
    ],
    minKB: 30,
    maxKB: 50,
    published: false,
    showAsButton: false,
  },
  {
    slug: 'resume-profile-photo-3x4-cm',
    type: 'photo',
    name: 'Resume Profile Photo 3x4 cm',
    title: 'Resume Profile Photo 3x4 cm',
    seoTitle: 'Resume Profile Photo 3x4 cm',
    seoDescription:
      'Resize a resume profile photo to 3x4 cm dimensions in your browser for job portals and application forms.',
    description:
      'Resize a professional profile photo for resumes, job applications, and portal uploads that expect a 3x4 cm portrait size.',
    h1: 'Resize Resume Profile Photo 3x4 cm',
    intro:
      'Use this preset when a recruiter or application portal wants a small profile photo that fits cleanly into a CV or job form.',
    faqs: [
      {
        q: 'Is this suitable for a job application?',
        a: 'Yes. It is designed for resume uploads, employer portals, and candidate profile forms that need a neatly framed portrait.',
      },
      {
        q: 'Can I use the same crop for LinkedIn or job portals?',
        a: 'Yes. The crop and dimension tools work the same way, and you can adjust the target field if a portal requests a slightly different size.',
      },
    ],
    width: 354,
    height: 472,
    minKB: 25,
    maxKB: 60,
    widthCm: 3,
    heightCm: 4,
    dpi: 300,
    published: false,
    showAsButton: false,
  },
  {
    slug: 'pan-card-photo-35x45-mm',
    type: 'photo',
    name: 'PAN Card Photo 35x45 mm',
    title: 'PAN Card Photo 35x45 mm',
    seoTitle: 'PAN Card Photo 35x45 mm',
    seoDescription:
      'Resize a PAN card or ID photo to 35x45 mm for Indian financial and identity applications.',
    description:
      'Resize a PAN, KYC, or identity photo to a standard 35x45 mm format for Indian documentation and account setup.',
    h1: 'Resize PAN Card Photo 35x45 mm',
    intro:
      'This preset is useful for financial and identity documentation that expects a photograph sized to a classic 35x45 mm format.',
    faqs: [
      {
        q: 'What kinds of forms use this?',
        a: 'This is helpful for KYC, financial forms, and identity submissions that require a standard passport-style portrait crop.',
      },
      {
        q: 'Can I adjust the background and crop?',
        a: 'Yes. Use the crop and quality controls to keep the face centered while fitting the required dimensions and file target.',
      },
    ],
    width: 413,
    height: 531,
    minKB: 30,
    maxKB: 80,
    widthCm: 3.5,
    heightCm: 4.5,
    dpi: 300,
    published: false,
    showAsButton: false,
  },
  {
    slug: 'aadhaar-update-photo-35x45-mm',
    type: 'photo',
    name: 'Aadhaar Update Photo 35x45 mm',
    title: 'Aadhaar Update Photo 35x45 mm',
    seoTitle: 'Aadhaar Update Photo 35x45 mm',
    seoDescription:
      'Resize an Aadhaar update or proof photo to 35x45 mm in your browser for Indian ID and enrollment forms.',
    description:
      'Resize a proof photo for Aadhaar updates, enrollment forms, and identity validation workflows that ask for a clear portrait. ',
    h1: 'Resize Aadhaar Update Photo 35x45 mm',
    intro:
      'Use this preset for identity update, enrollment, and service forms that require a crisp, standard-size photo with a compact file size.',
    faqs: [
      {
        q: 'Is this meant for Aadhaar or KYC use?',
        a: 'Yes. It helps with Aadhaar and other identity reviews where a clear passport-style photo is requested.',
      },
      {
        q: 'Can this be customized for other ID forms?',
        a: 'Yes. You can edit the dimensions and size target directly in the resizer to handle a similar form if needed.',
      },
    ],
    width: 413,
    height: 531,
    minKB: 30,
    maxKB: 80,
    widthCm: 3.5,
    heightCm: 4.5,
    dpi: 300,
    published: false,
    showAsButton: false,
  },
  {
    slug: 'driving-licence-photo-35x45-mm',
    type: 'photo',
    name: 'Driving Licence Photo 35x45 mm',
    title: 'Driving Licence Photo 35x45 mm',
    seoTitle: 'Driving Licence Photo 35x45 mm',
    seoDescription:
      'Resize a driving licence or transport photo to the standard 35x45 mm size in your browser.',
    description:
      'Resize a driving licence profile photo to the exact standard size expected in many transport and application forms.',
    h1: 'Resize Driving Licence Photo 35x45 mm',
    intro:
      'This preset helps when a driving licence or transport document expects a standard-size photograph with a compact final file.',
    faqs: [
      {
        q: 'Is this for licence renewals?',
        a: 'Yes. It is useful for renewal and application forms that need a standard portrait photo in a compact file size.',
      },
      {
        q: 'Can I use a different face crop?',
        a: 'Yes, the tool allows crop adjustment so the face stays centered while meeting the ID dimensions.',
      },
    ],
    width: 413,
    height: 531,
    minKB: 30,
    maxKB: 80,
    widthCm: 3.5,
    heightCm: 4.5,
    dpi: 300,
    published: false,
    showAsButton: false,
  },
  {
    slug: 'student-visa-photo-35x45-mm',
    type: 'photo',
    name: 'Student Visa Photo 35x45 mm',
    title: 'Student Visa Photo 35x45 mm',
    seoTitle: 'Student Visa Photo 35x45 mm',
    seoDescription:
      'Resize a student visa or overseas admission photo to standard 35x45 mm dimensions directly in your browser.',
    description:
      'Resize a student visa or abroad application photo to a passport-style 35x45 mm format for application portals and visa requirements.',
    h1: 'Resize Student Visa Photo 35x45 mm',
    intro:
      'This preset is for student visa, scholarship, and overseas application flows where a clear face photo with standard dimensions is required.',
    faqs: [
      {
        q: 'Is this useful for study abroad applications?',
        a: 'Yes. It is built for visa and academic applications requiring a neatly centered passport-style portrait.',
      },
      {
        q: 'What if the form uses a different output size?',
        a: 'The dimension fields stay editable, so you can fine-tune the crop and size to match the exact application requirement.',
      },
    ],
    width: 413,
    height: 531,
    minKB: 30,
    maxKB: 80,
    widthCm: 3.5,
    heightCm: 4.5,
    dpi: 300,
    published: false,
    showAsButton: false,
  },
  {
    slug: 'college-admission-photo-50-kb',
    type: 'photo',
    name: 'College Admission Photo 50 KB',
    title: 'College Admission Photo 50 KB',
    seoTitle: 'College Admission Photo 50 KB',
    seoDescription:
      'Resize a college admission or scholarship photo to a compact 50 KB size in the browser.',
    description:
      'Resize a photo for college admissions, scholarship forms, and student profiles that need a small file with a clean portrait.',
    h1: 'Resize College Admission Photo 50 KB',
    intro:
      'This preset is helpful for admissions offices, college portals, and scholarship applications that accept a compact, front-facing photo.',
    faqs: [
      {
        q: 'Why use this for student forms?',
        a: 'Universities and scholarship portals often want a clean portrait and a small file size for easy upload and review.',
      },
      {
        q: 'Will the face remain clear?',
        a: 'Yes. The crop and quality controls help preserve a crisp headshot while bringing the file within the target KB range.',
      },
    ],
    minKB: 30,
    maxKB: 50,
    published: false,
    showAsButton: false,
  },
  {
    slug: 'photo-20-kb',
    type: 'photo',
    name: 'Photo 20 KB',
    title: 'Photo 20 KB',
    seoTitle: 'Photo 20 KB Draft',
    seoDescription:
      'Draft photo preset for tighter 20 KB output requirements. This page is intentionally unpublished until the source guidance is verified.',
    description:
      'Draft photo preset for tighter 20 KB output requirements. This page is intentionally unpublished until the source guidance is verified.',
    h1: 'Photo 20 KB',
    intro:
      'This draft preset is intended for lower-size photo submissions where the final image must stay near 20 KB while keeping the subject well framed.',
    faqs: [
      {
        q: 'Why is this preset still a draft?',
        a: 'The exact width, height, and output range should be checked against the original guidance before it is published live.',
      },
      {
        q: 'Can I still use the browser tool with this target?',
        a: 'Yes. The resizer itself is unchanged, and the draft preset simply keeps the page out of the published sitemap until verified.',
      },
    ],
    minKB: 15,
    maxKB: 20,
    published: false,
    showAsButton: true,
  },
  {
    slug: 'photo-100-kb',
    type: 'photo',
    name: 'Photo 100 KB',
    title: 'Photo 100 KB',
    seoTitle: 'Photo 100 KB Draft',
    seoDescription:
      'Draft photo preset for 100 KB output. This page is intentionally unpublished until the source guidance is verified.',
    description:
      'Draft photo preset for a 100 KB photo target. This page is intentionally unpublished until the source guidance is verified.',
    h1: 'Photo 100 KB',
    intro:
      'This draft preset is useful for moderate-size photo uploads that need a larger file ceiling while still keeping the result compact and clear.',
    faqs: [
      {
        q: 'When would I use a 100 KB target?',
        a: 'Use it when the portal allows a larger output file while still keeping the image comfortably within a compact size budget.',
      },
      {
        q: 'Is this page visible in the sitemap?',
        a: 'No. It is a draft and intentionally excluded from the published site until it is verified.',
      },
    ],
    minKB: 80,
    maxKB: 100,
    published: false,
    showAsButton: false,
  },
  {
    slug: 'photo-200-kb',
    type: 'photo',
    name: 'Photo 200 KB',
    title: 'Photo 200 KB',
    seoTitle: 'Photo 200 KB Draft',
    seoDescription:
      'Draft photo preset for 200 KB output. This page is intentionally unpublished until the source guidance is verified.',
    description:
      'Draft photo preset for a 200 KB photo target. This page is intentionally unpublished until the source guidance is verified.',
    h1: 'Photo 200 KB',
    intro:
      'This draft preset supports larger photo submissions where the file must remain reasonably compact but still deliver more detail and texture.',
    faqs: [
      {
        q: 'Why keep a 200 KB variant separate?',
        a: 'Larger file ceilings often require different crop and quality settings, and the draft keeps it isolated until the correct guidance is confirmed.',
      },
      {
        q: 'Can the tool still process this target?',
        a: 'Yes. The tool remains the same; this page is only excluded from the published site until it is validated.',
      },
    ],
    minKB: 160,
    maxKB: 200,
    published: false,
    showAsButton: true,
  },
  {
    slug: 'signature-10-kb',
    type: 'signature',
    name: 'Signature 10 KB',
    title: 'Signature 10 KB',
    seoTitle: 'Resize Signature to 10 KB Online',
    seoDescription:
      'Work toward an 8–10 KB signature image target. Crop excess whitespace, check stroke detail, and follow your destination’s requirements.',
    description:
      'Use this 8–10 KB ExactSpec preset as a starting point when a destination gives you a signature file-size limit. It is not a universal requirement.',
    h1: 'Resize Signature to 10 KB',
    intro:
      'This ExactSpec preset starts with an 8–10 KB target range for a signature image. Crop carefully to remove excess whitespace while keeping the strokes readable, and check the limit specified by your destination.',
    faqs: [
      {
        q: 'How do I reduce a signature image to 10 KB?',
        a: 'Upload a JPG or PNG, crop away unnecessary margins without cutting into the strokes, then inspect the output size and preview. ExactSpec chooses JPEG quality automatically, but cannot guarantee every image will reach the target.',
      },
      {
        q: 'Why does my signature look blurry after compression?',
        a: 'JPEG compression can soften thin strokes, especially at very small file sizes. Try a less aggressive file-size target or larger pixel dimensions if the destination allows it, then compare the preview.',
      },
      {
        q: 'Should I crop empty space around my signature?',
        a: 'Usually, removing unnecessary whitespace gives the signature a more useful frame. Keep a small margin and do not crop through any strokes.',
      },
      {
        q: 'Does the tool preserve transparent backgrounds?',
        a: 'No. ExactSpec exports JPG files, so transparent areas in a PNG input are rendered against a white background.',
      },
      {
        q: 'Is 10 KB required for every application?',
        a: 'No. The 8–10 KB range is this preset’s target, not a universal requirement. Follow the current file-size and format rules for your destination.',
      },
    ],
    howToUse: [
      'Upload a JPG or PNG scan or photo of the signature.',
      'Crop excess whitespace while keeping every stroke intact and the signature centered.',
      'Review the output preview and file size before downloading the JPG.',
      'If the result misses your destination’s limit or loses detail, adjust the dimensions or target range if allowed, then review it again.',
    ],
    practicalTips: [
      'Leave a small margin around the signature rather than cutting close to the strokes.',
      'Inspect thin lines at a useful zoom level; stronger compression can make them less distinct.',
      'Check the downloaded JPG and the destination’s format and size requirements.',
    ],
    limitations:
      'The 8–10 KB range is a configurable preset target, not an application standard. JPEG compression may reduce stroke detail, and ExactSpec cannot guarantee that every source image will meet a requested range while remaining legible.',
    relatedLinks: [
      { label: 'Home image resizer', href: '/' },
      { label: 'All published size presets', href: '/all-sizes/' },
    ],
    minKB: 8,
    maxKB: 10,
    published: true,
    showAsButton: true,
  },
  {
    slug: 'signature-20-kb',
    type: 'signature',
    name: 'Signature 20 KB',
    title: 'Signature 20 KB',
    seoTitle: 'Signature 20 KB Draft',
    seoDescription:
      'Draft signature preset for 20 KB output. This page is intentionally unpublished until the source guidance is verified.',
    description:
      'Draft signature preset for a 20 KB output target. This page is intentionally unpublished until the source guidance is verified.',
    h1: 'Signature 20 KB',
    intro:
      'This draft preset covers a slightly larger signature output where the file still needs to stay compact while remaining easy to read.',
    faqs: [
      {
        q: 'My image is not downloading. What should I do?',
        a: 'Check your phone or pc downloads folder. If not downloaded , reload the page and try again. It will work.',
      },
      {
        q: 'Will the tool still work the same way?',
        a: 'Yes. The resizer logic remains the same; the draft status only controls visibility in the published site.',
      },
    ],
    minKB: 15,
    maxKB: 20,
    published: false,
    showAsButton: false,
  },
];

export const PUBLISHED_PRESETS = PRESETS.filter(
  (preset) => preset.published !== false
);

export const QUICK_PRESETS = PRESETS.filter(
  (preset) => preset.showAsButton === true
).slice(0, 4);
