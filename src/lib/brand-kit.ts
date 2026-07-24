import { db } from '@/lib/db'

export interface DefaultBrandKit {
  logoUrl: string | null
  primaryColor: string
  businessName: string | null
}

const FALLBACK_COLOR = '#4B7F52'

// BrandKit only stores logo/color — the business name always lives on Workspace.name,
// regardless of whether a BrandKit row exists (it used to short-circuit to null whenever a
// BrandKit row was present, so the name never actually surfaced once one was created).
export async function getDefaultBrandKit(workspaceId: string): Promise<DefaultBrandKit> {
  const [kit, workspace] = await Promise.all([
    db.brandKit.findFirst({ where: { workspaceId, isDefault: true }, select: { logoUrl: true, primaryColor: true } }),
    db.workspace.findUnique({ where: { id: workspaceId }, select: { name: true, logoUrl: true } }),
  ])

  return {
    logoUrl: kit?.logoUrl ?? workspace?.logoUrl ?? null,
    primaryColor: kit?.primaryColor ?? FALLBACK_COLOR,
    businessName: workspace?.name ?? null,
  }
}

export interface BrandKitUpdate {
  businessName?: string
  primaryColor?: string
  logoUrl?: string
}

// Used by the real Brand Kit settings page (src/app/app/brand-kit/page.tsx) to persist
// changes — the name goes on Workspace (its one real home), logo/color on a default
// BrandKit row (created on first save, since a workspace has none until someone sets one).
export async function saveBrandKit(workspaceId: string, update: BrandKitUpdate): Promise<DefaultBrandKit> {
  if (update.businessName !== undefined) {
    await db.workspace.update({ where: { id: workspaceId }, data: { name: update.businessName } })
  }

  if (update.primaryColor !== undefined || update.logoUrl !== undefined) {
    const existing = await db.brandKit.findFirst({ where: { workspaceId, isDefault: true }, select: { id: true } })
    if (existing) {
      await db.brandKit.update({
        where: { id: existing.id },
        data: {
          ...(update.primaryColor !== undefined ? { primaryColor: update.primaryColor } : {}),
          ...(update.logoUrl !== undefined ? { logoUrl: update.logoUrl } : {}),
        },
      })
    } else {
      await db.brandKit.create({
        data: {
          workspaceId,
          isDefault: true,
          primaryColor: update.primaryColor ?? FALLBACK_COLOR,
          logoUrl: update.logoUrl,
        },
      })
    }
  }

  return getDefaultBrandKit(workspaceId)
}
