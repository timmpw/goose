import { getAcpClient } from './acpConnection';
import { normalizeAcpError } from './errors';

export type HarnessKind = 'recipe' | 'app';

export type HarnessListItem = {
  id: number;
  title: string;
  description?: string;
  activities?: string[];
  author?: string;
  updated_at?: string;
  install_count?: number;
  mine?: boolean;
};

export type HarnessFetchedItem = {
  title: string;
  description?: string;
  author?: string;
  payload: string;
};

export async function harnessPublishRecipe(
  recipeId: string
): Promise<{ itemId: number; updated: boolean }> {
  try {
    const client = await getAcpClient();
    const response = await client.goose.harnessPublishRecipe_unstable({ recipe_id: recipeId });
    return { itemId: response.item_id, updated: response.updated };
  } catch (error) {
    throw normalizeAcpError(error, 'Failed to publish recipe to 10router');
  }
}

export async function harnessPublishApp(
  appName: string
): Promise<{ itemId: number; updated: boolean }> {
  try {
    const client = await getAcpClient();
    const response = await client.goose.harnessPublishApp_unstable({ app_name: appName });
    return { itemId: response.item_id, updated: response.updated };
  } catch (error) {
    throw normalizeAcpError(error, 'Failed to publish app to 10router');
  }
}

export async function harnessList(kind: HarnessKind): Promise<HarnessListItem[]> {
  try {
    const client = await getAcpClient();
    const response = await client.goose.harnessList_unstable({ kind });
    return response.items ?? [];
  } catch (error) {
    throw normalizeAcpError(error, 'Failed to load the 10router library');
  }
}

export async function harnessFetch(kind: HarnessKind, itemId: number): Promise<HarnessFetchedItem> {
  try {
    const client = await getAcpClient();
    return await client.goose.harnessFetch_unstable({ kind, item_id: itemId });
  } catch (error) {
    throw normalizeAcpError(error, 'Failed to fetch the item from 10router');
  }
}

export async function harnessUnpublish(kind: HarnessKind, itemId: number): Promise<void> {
  try {
    const client = await getAcpClient();
    await client.goose.harnessUnpublish_unstable({ kind, item_id: itemId });
  } catch (error) {
    throw normalizeAcpError(error, 'Failed to unpublish the item');
  }
}
