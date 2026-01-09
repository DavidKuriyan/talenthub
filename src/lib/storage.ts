import { supabase } from "./supabase";

/**
 * Configuration for Supabase Storage buckets
 */
export const STORAGE_BUCKETS = {
    CHAT_IMAGES: "chat-images",
    CHAT_FILES: "chat-files",
    AVATARS: "user-avatars",
} as const;

/**
 * Initialize storage buckets if they don't exist
 * Call this once during application startup or in an admin endpoint
 */
export async function initializeStorageBuckets() {
    try {
        const buckets = [
            {
                name: STORAGE_BUCKETS.CHAT_IMAGES,
                public: true,
                allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
                maxSize: 5 * 1024 * 1024, // 5MB
            },
            {
                name: STORAGE_BUCKETS.CHAT_FILES,
                public: true,
                allowedMimeTypes: [
                    "application/pdf",
                    "application/msword",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "application/vnd.ms-excel",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ],
                maxSize: 20 * 1024 * 1024, // 20MB
            },
            {
                name: STORAGE_BUCKETS.AVATARS,
                public: true,
                allowedMimeTypes: ["image/jpeg", "image/png"],
                maxSize: 2 * 1024 * 1024, // 2MB
            },
        ];

        for (const bucket of buckets) {
            const { data: existingBuckets } = await supabase.storage.listBuckets();
            const bucketExists = existingBuckets?.some((b) => b.name === bucket.name);

            if (!bucketExists) {
                const { error } = await supabase.storage.createBucket(bucket.name, {
                    public: bucket.public,
                });

                if (error) {
                    console.error(`Failed to create bucket ${bucket.name}:`, error);
                } else {
                    console.log(`Created storage bucket: ${bucket.name}`);
                }
            }
        }

        // Set bucket policies (requires admin/service role key in RLS policies)
        console.log("Storage buckets initialized");
    } catch (error) {
        console.error("Error initializing storage buckets:", error);
        throw error;
    }
}

/**
 * Upload a chat image with tenant isolation
 */
export async function uploadChatImage(
    file: File,
    tenantId: string,
    roomId: string
): Promise<{ url: string; path: string }> {
    if (!file.type.startsWith("image/")) {
        throw new Error("File must be an image");
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        throw new Error("Image must be smaller than 5MB");
    }

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const fileName = `${timestamp}-${random}-${file.name}`;
    const filePath = `${tenantId}/${roomId}/${fileName}`;

    try {
        const { error: uploadError, data } = await supabase.storage
            .from(STORAGE_BUCKETS.CHAT_IMAGES)
            .upload(filePath, file, {
                cacheControl: "3600",
                upsert: false,
            });

        if (uploadError) {
            throw uploadError;
        }

        const { data: publicData } = supabase.storage
            .from(STORAGE_BUCKETS.CHAT_IMAGES)
            .getPublicUrl(filePath);

        return {
            url: publicData.publicUrl,
            path: filePath,
        };
    } catch (error) {
        console.error("Error uploading chat image:", error);
        throw error;
    }
}

/**
 * Upload a chat file with tenant isolation
 */
export async function uploadChatFile(
    file: File,
    tenantId: string,
    roomId: string
): Promise<{ url: string; path: string }> {
    const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!allowedTypes.includes(file.type)) {
        throw new Error("File type not allowed");
    }

    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
        throw new Error("File must be smaller than 20MB");
    }

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const fileName = `${timestamp}-${random}-${file.name}`;
    const filePath = `${tenantId}/${roomId}/${fileName}`;

    try {
        const { error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKETS.CHAT_FILES)
            .upload(filePath, file, {
                cacheControl: "3600",
                upsert: false,
            });

        if (uploadError) {
            throw uploadError;
        }

        const { data: publicData } = supabase.storage
            .from(STORAGE_BUCKETS.CHAT_FILES)
            .getPublicUrl(filePath);

        return {
            url: publicData.publicUrl,
            path: filePath,
        };
    } catch (error) {
        console.error("Error uploading chat file:", error);
        throw error;
    }
}

/**
 * Upload a user avatar with tenant isolation
 */
export async function uploadAvatar(
    file: File,
    tenantId: string,
    userId: string
): Promise<{ url: string; path: string }> {
    if (!file.type.startsWith("image/")) {
        throw new Error("Avatar must be an image");
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
        throw new Error("Avatar must be smaller than 2MB");
    }

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const fileName = `${timestamp}-${random}-${file.name}`;
    const filePath = `${tenantId}/${userId}/${fileName}`;

    try {
        const { error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKETS.AVATARS)
            .upload(filePath, file, {
                cacheControl: "86400", // 24 hours
                upsert: false,
            });

        if (uploadError) {
            throw uploadError;
        }

        const { data: publicData } = supabase.storage
            .from(STORAGE_BUCKETS.AVATARS)
            .getPublicUrl(filePath);

        return {
            url: publicData.publicUrl,
            path: filePath,
        };
    } catch (error) {
        console.error("Error uploading avatar:", error);
        throw error;
    }
}

/**
 * Delete a file from storage
 */
export async function deleteStorageFile(bucket: string, filePath: string) {
    try {
        const { error } = await supabase.storage.from(bucket).remove([filePath]);

        if (error) {
            throw error;
        }

        console.log(`Deleted file: ${filePath}`);
    } catch (error) {
        console.error("Error deleting file:", error);
        throw error;
    }
}

/**
 * Get signed URL for private file access (if needed)
 */
export async function getSignedUrl(
    bucket: string,
    filePath: string,
    expiresIn: number = 3600 // 1 hour default
) {
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(filePath, expiresIn);

        if (error) {
            throw error;
        }

        return data.signedUrl;
    } catch (error) {
        console.error("Error generating signed URL:", error);
        throw error;
    }
}
