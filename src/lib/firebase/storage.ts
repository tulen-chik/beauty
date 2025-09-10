import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';

export const uploadServiceImage = async (serviceId: string, file: File) => {
  const storage = getStorage();
  const id = `${Date.now()}-${file.name}`;
  const path = `serviceImages/${serviceId}/${id}`;
  const ref = storageRef(storage, path);
  await uploadBytes(ref, file);
  const url = await getDownloadURL(ref);
  return {
    id,
    serviceId,
    url,
    storagePath: path,
    uploadedAt: new Date().toISOString(),
  };
};

export const deleteServiceImage = async (storagePath: string) => {
  const storage = getStorage();
  const ref = storageRef(storage, storagePath);
  await deleteObject(ref);
};

export const getServiceImages = async (serviceId: string) => {
  const storage = getStorage();
  const dirRef = storageRef(storage, `serviceImages/${serviceId}`);
  const res = await listAll(dirRef);
  const images = await Promise.all(
    res.items.map(async (itemRef) => {
      const url = await getDownloadURL(itemRef);
      return {
        id: itemRef.name,
        serviceId,
        url,
        storagePath: itemRef.fullPath,
        uploadedAt: '',
      };
    })
  );
  return images;
};

export const uploadBlogImage = async (postId: string, file: File) => {
  const storage = getStorage();
  const id = `${Date.now()}-${file.name}`;
  const path = `blog/images/${postId}/${id}`;
  const sref = storageRef(storage, path);
  await uploadBytes(sref, file);
  const url = await getDownloadURL(sref);
  return { id, postId, url, storagePath: path, uploadedAt: new Date().toISOString() };
};

export const deleteBlogImage = async (storagePath: string) => {
  const storage = getStorage();
  const sref = storageRef(storage, storagePath);
  await deleteObject(sref);
};
