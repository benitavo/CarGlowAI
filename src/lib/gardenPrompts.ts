export interface GardenStyle {
  name: string
  description: string
  keywords: string
  plantPalette: string
}

export const GARDEN_STYLES: Record<string, GardenStyle> = {
  'gazon-fleurs': {
    name: 'Gazon & Fleurs',
    description: 'a lush green lawn with colorful flowering borders (roses, lavender, peonies, seasonal flowers). Well-maintained grass with clean edges and vibrant flower beds.',
    keywords: 'manicured green lawn, colorful flower borders, classic cottage-garden feel',
    plantPalette: 'roses, dahlias, geraniums, peonies, boxwood edging',
  },
  'mediterraneen': {
    name: 'Méditerranéen',
    description: 'a Mediterranean-style garden with olive trees, lavender, rosemary bushes, terracotta pots, white gravel, and natural stone pathways typical of southern France.',
    keywords: 'dry gravel/stone textures, warm terracotta tones, drought-tolerant',
    plantPalette: 'olive tree, lavender, rosemary, natural stone paving, agave accents',
  },
  'contemporain': {
    name: 'Contemporain',
    description: 'a modern contemporary garden with clean geometric lines, ornamental grasses, structural dark-leafed plants, polished concrete or slate paving, and minimalist design.',
    keywords: 'clean geometric lines, minimalist structured beds, restrained palette',
    plantPalette: 'boxwood/yew hedging cut to clean forms, ornamental grasses (sparse, per constraint), single specimen trees',
  },
  'naturel': {
    name: 'Naturel & Sauvage',
    description: 'a naturalistic wildflower garden with native French plants, tall ornamental grasses, wildflowers, wooden sleeper paths, and an eco-friendly biodiversity-rich design.',
    keywords: 'wildflower meadow feel, informal drifts, native species',
    plantPalette: 'native wildflowers, tall perennials, naturalized bulbs, low structured mowing paths',
  },
  'zen': {
    name: 'Zen & Japonais',
    description: 'a Japanese Zen garden with bamboo, mossy stones, raked gravel, stone lanterns, stepping stones, and a serene meditative atmosphere.',
    keywords: 'raked gravel/moss, asymmetric balance, calm minimal palette',
    plantPalette: 'bamboo (contained, non-invasive clumping variety), moss, Japanese maple (per growth-anticipation rule), smooth stones',
  },
  'potager': {
    name: 'Potager',
    description: 'a beautiful kitchen garden (potager) with raised wooden vegetable beds, abundant vegetables and aromatic herbs (thyme, basil, sage), and neat gravel paths between the beds.',
    keywords: 'organized raised beds, productive garden feel',
    plantPalette: 'vegetable rows, aromatic herbs (thyme, basil, mint in contained beds), fruit espaliers',
  },
}

export function buildImagePrompt(style: GardenStyle, characteristics?: string) {
  const userText = characteristics?.trim() || 'Aucune demande particulière.'

  return `Transform this garden photo into a photorealistic rendering.

SCENE: Keep the exact camera angle, framing, and perspective of the original
photo. Preserve the hardscape (walls, steps, fences, paving) structurally
identical to the original — only modify plantings, furniture, and ground
surface materials, unless the user's characteristics below say otherwise.

STYLE: Apply the "${style.name}" garden style — ${style.description}.
${style.keywords}

MOOD: Photorealistic, natural daylight photography — not illustrative, not
stylized, not cartoon-like. Bright, warm, flattering light. The existing
plantings should look at their healthiest, fullest, most flowering stage —
a garden at its best moment, giving a genuine "wow, I want this" effect,
while remaining fully believable as a real, achievable outcome.

SPECIFIC PLANTS: ${style.plantPalette}, chosen to suit the sun/shade
exposure and apparent climate visible in the source photo. Never invent
plants incompatible with that exposure.

USER CHARACTERISTICS (optional, provided by the client):
"${userText}"
→ Incorporate these requests as closely as possible. If a request conflicts
with a constraint below (e.g. asks for invasive/high-maintenance species),
prioritize the constraint and adapt the request in spirit rather than
ignoring it outright.

CONSTRAINTS (always apply, regardless of style or user input):
- Preserve a plant of similar type, color, and size in every location where
  a potted plant currently exists on the original photo — never remove or
  relocate them; they may look healthier/fuller, never a different species.
- Avoid dense clusters of ornamental grasses or pampas grass; use only as
  sparse accents with visible spacing between plant groups.
- Position any large-growth tree/shrub accounting for its mature size —
  leave clearance from walls/neighboring plants and never place it where
  future growth would block plantings behind or above it.
- Keep hardscape (walls, steps, fences, structural paving) identical to the
  original — light cleaning (moss/grime removal, sweeping debris) is
  allowed, but never resize, add, or remove structural elements.
- Never show vegetation in physically implausible locations (e.g. plants on
  a bare wall with no visible soil/support/planter) — every plant needs a
  logical, plausible growing medium already present or realistic on site.
- No hallucinated objects, impossible proportions, or elements that would
  break the client's trust in the rendering.

OUTPUT: a single photorealistic image, same resolution/aspect ratio as the
input photo.`
}

export function buildRetouchPrompt(instruction: string) {
  return `Edit this already-rendered garden image with one specific, targeted change.

INSTRUCTION FROM THE USER:
"${instruction.trim()}"

SCOPE: Apply only the change described above. Keep everything else in the
image — camera angle, framing, hardscape, existing plantings, lighting,
and overall composition — exactly as it is in the provided image.

MOOD: Match the photorealistic style, lighting, and quality already present
in the source image. The edit must blend in seamlessly, as if it were part
of the original rendering.

CONSTRAINTS:
- Do not regenerate or restyle areas unrelated to the instruction.
- Do not resize, add, or remove structural elements (walls, steps, fences)
  unless explicitly asked.
- No hallucinated objects, impossible proportions, or elements that would
  break the client's trust in the rendering.

OUTPUT: a single photorealistic image, same resolution/aspect ratio as the
input image.`
}

export function buildVideoPrompt(characteristics?: string) {
  const userText = characteristics?.trim() || 'Aucune demande particulière.'

  return `Animate this garden image into a short, photorealistic video clip.

CAMERA: Slow, smooth cinematic push-in or gentle lateral pan across the
garden (pick whichever best fits the framing) — no cuts, no zoom snaps,
natural handheld-gimbal smoothness. Duration: 4-6 seconds.

MOTION: Add only natural, physically plausible ambient movement — leaves
and grass swaying gently in a light breeze, dappled sunlight shifting
softly, subtle water movement if a fountain/water feature is present.
No new objects appearing or disappearing. No plants growing, blooming, or
changing during the clip. No people, animals, or vehicles entering the
frame unless already present in the source image.

STYLE: Photorealistic, natural daylight video — not illustrative, not
stylized, no CGI-looking particle effects or exaggerated motion.

STRUCTURAL LOCK: The hardscape, plant positions, plant species, and overall
composition must remain exactly as shown in the source image throughout
the entire clip — the video brings the still image to life, it does not
reinterpret or regenerate the scene.

USER CHARACTERISTICS (optional, for context only, no structural changes):
"${userText}"

GOAL: Give the client a short, believable "living garden" preview that
reinforces the wow effect from the still image — calm, inviting, real —
without introducing anything that wasn't already validated in the image
generation step.`
}

export function buildSocialCaptionPrompt(styleName: string, businessName?: string, ctaText?: string) {
  return `Tu es community manager pour une entreprise de paysagisme.

Écris une légende Instagram/Facebook courte (3 à 5 phrases maximum), chaleureuse et
professionnelle, pour accompagner une vidéo avant/après montrant la transformation d'un
jardin dans un style "${styleName}".
${businessName ? `\nL'entreprise s'appelle "${businessName}".` : ''}
${ctaText ? `\nTermine par un appel à l'action reprenant l'idée : "${ctaText}".` : ''}

Ajoute ensuite, sur une ligne séparée, 4 à 6 hashtags pertinents en français (paysagisme,
jardin, avant/après, etc.).

Réponds uniquement avec le texte de la légende et les hashtags, sans introduction ni
commentaire, sans guillemets autour du texte.`
}
