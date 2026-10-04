import { GroupPicture } from '../schemas/group.schema.ts';
import { createPresignedUrl } from '../services/s3.service.ts';
import { S3AvatarStoragePath } from '../types/chat.ts';

export default async function createGroupPictureUrl(
  groupId: number,
  groupPictureName: string | null,
): Promise<GroupPicture> {
  const groupPictureUrl = groupPictureName
    ? await createPresignedUrl(
        process.env.BUCKET_NAME!,
        `${S3AvatarStoragePath.GROUP_AVATARS}/${groupId}/${groupPictureName}`,
      )
    : null;

  return { group_picture: groupPictureUrl };
}
