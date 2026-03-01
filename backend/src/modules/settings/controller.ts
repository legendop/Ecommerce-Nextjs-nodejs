import { Request, Response } from 'express';
import * as settingsService from './service';

// GET /api/settings/public - Get public site configuration
export async function getPublicSettings(req: Request, res: Response) {
  try {
    const settings = await settingsService.getPublicSettings();
    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Get public settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
    });
  }
}

// GET /api/settings - Get all settings (admin only)
export async function getAllSettings(req: Request, res: Response) {
  try {
    const settings = await settingsService.getAllSettings();
    // Convert BigInt id to string for JSON serialization
    const serializedSettings = settings.map((s) => ({
      ...s,
      id: s.id.toString(),
    }));
    res.json({
      success: true,
      data: serializedSettings,
    });
  } catch (error) {
    console.error('Get all settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
    });
  }
}

// PUT /api/settings/:key - Update a setting (admin only)
export async function updateSetting(req: Request, res: Response) {
  try {
    const { key } = req.params;
    const { value, type, isPublic, description } = req.body;

    const setting = await settingsService.updateSetting(
      key,
      value,
      type,
      isPublic,
      description
    );

    res.json({
      success: true,
      data: { ...setting, id: setting.id.toString() },
      message: 'Setting updated successfully',
    });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update setting',
    });
  }
}

// DELETE /api/settings/:key - Delete a setting (admin only)
export async function deleteSetting(req: Request, res: Response) {
  try {
    const { key } = req.params;
    await settingsService.deleteSetting(key);
    res.json({
      success: true,
      message: 'Setting deleted successfully',
    });
  } catch (error) {
    console.error('Delete setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete setting',
    });
  }
}

// POST /api/settings/bulk - Bulk update settings (admin only)
export async function bulkUpdateSettings(req: Request, res: Response) {
  try {
    const settings: Record<string, { value: string; type?: string; isPublic?: boolean; description?: string }> = req.body;

    const results = await Promise.all(
      Object.entries(settings).map(([key, data]) =>
        settingsService.updateSetting(
          key,
          data.value,
          data.type || 'string',
          data.isPublic !== false,
          data.description
        )
      )
    );

    // Convert BigInt ids to string for JSON serialization
    const serializedResults = results.map((r) => ({ ...r, id: r.id.toString() }));

    res.json({
      success: true,
      data: serializedResults,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Bulk update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
    });
  }
}
