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
  lastVerified?: string;
  faqs: { q: string; a: string }[];
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
      'Reduce your photo to under 50 KB, free, right in your browser. Nothing is uploaded.',
    description:
      'Resize a photo to a 50 KB target in your browser with clean crop, quality, and export controls.',
    h1: 'Resize Photo to 50 KB',
    intro:
      'Many online forms limit photo uploads to about 50 KB. Upload your JPG or PNG, and this tool adjusts the image until the file lands between 30 and 50 KB. Everything runs in your browser, so your photo is never uploaded.',
    faqs: [
      {
        q: 'Why is my photo still above 50 KB?',
        a: 'Large or detailed photos may need smaller dimensions as well as lower quality. Enter a smaller width and height, or crop closer to the face, then export again.',
      },
      {
        q: 'Will my photo look blurry?',
        a: 'Compressing to 50 KB removes some detail, but ID-style photos often stay clear enough. If the result looks too soft and your form allows it, raise the maximum size a little.',
      },
      {
        q: 'Can I use a different size?',
        a: 'Yes. Change the minimum and maximum size or the dimensions in the tool, and export again.',
      },
      {
        q: 'Does it work on my phone?',
        a: "Yes. Choose a photo from your gallery or take one with your camera. Everything runs in your phone's browser.",
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
      'Resize an Indian passport photo to 35x45 mm dimensions in your browser without uploading files.',
    description:
      'Resize a passport-style photo to the standard 35x45 mm format for Indian applications and ID submissions.',
    h1: 'Resize Passport Size Photo 35 x 45 mm',
    intro:
      'Use this preset for passport, visa, and ID-style photo submissions that need a standard 35x45 mm print size with a clean crop and crisp export.',
    faqs: [
      {
        q: 'What is the standard passport photo size?',
        a: 'This preset follows the common 35x45 mm passport-portrait format used for Indian documentation and application images.',
      },
      {
        q: 'Can I crop the face more tightly?',
        a: 'Yes. Keep the subject centered and crop before exporting, then use the target dimensions to match the required final output.',
      },
    ],
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
      'Resize a signature image to a 10 KB target in your browser with a quick crop and export flow.',
    description:
      'Resize a signature image to a 10 KB target in your browser while keeping the signature legible and centered.',
    h1: 'Resize Signature to 10 KB',
    intro:
      'Upload a signature scan or photo, crop it to the target shape, and export a smaller signature image that stays within the expected KB range.',
    faqs: [
      {
        q: 'Does this work for scanned signatures?',
        a: 'Yes. You can crop and compress a scanned signature directly in the browser until it falls within the target range.',
      },
      {
        q: 'Can I make the output more legible?',
        a: 'Yes. Use the crop and quality controls to keep the signature centered and avoid losing stroke detail.',
      },
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
    published: true,
    showAsButton: false,
  },
];

export const PUBLISHED_PRESETS = PRESETS.filter(
  (preset) => preset.published !== false
);

export const QUICK_PRESETS = PRESETS.filter(
  (preset) => preset.showAsButton === true
).slice(0, 4);
