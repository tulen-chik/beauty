import { deleteObject, getDownloadURL, getStorage, listAll,ref as storageRef, uploadBytes } from 'firebase/storage';

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

/**
 * Загружает аватар пользователя в Firebase Storage.
 * @param userId - ID пользователя.
 * @param file - Файл аватара для загрузки.
 * @returns Объект с информацией о загруженном аватаре.
 */
export const uploadUserAvatar = async (userId: string, file: File) => {
  const storage = getStorage();
  const id = `${Date.now()}-${file.name}`;
  const path = `userAvatars/${userId}/${id}`;
  const userAvatarRef = storageRef(storage, path);

  await uploadBytes(userAvatarRef, file);
  const url = await getDownloadURL(userAvatarRef);

  return {
    id,
    userId,
    url,
    storagePath: path,
    uploadedAt: new Date().toISOString(),
  };
};

/**
 * Удаляет аватар пользователя из Firebase Storage.
 * @param storagePath - Путь к файлу аватара в Storage.
 */
export const deleteUserAvatar = async (storagePath: string) => {
  // Не удаляем, если путь пустой
  if (!storagePath) return;

  const storage = getStorage();
  const userAvatarRef = storageRef(storage, storagePath);
  try {
    await deleteObject(userAvatarRef);
  } catch (error: any) {
    // Игнорируем ошибку, если файл уже не существует.
    // Это предотвращает сбой, если данные не синхронизированы.
    if (error.code === 'storage/object-not-found') {
      console.warn(`Avatar at path "${storagePath}" not found. Skipping deletion.`);
      return;
    }
    // Пробрасываем все остальные ошибки
    throw error;
  }
};

/**
 * Получает URL аватара пользователя.
 * Примечание: Обычно ссылка на аватар хранится в документе пользователя (например, в Firestore),
 * и эта функция может не понадобиться, если вы уже имеете доступ к `avatarUrl`.
 * Эта функция полезна, если нужно получить URL, не имея его в базе данных.
 * @param userId - ID пользователя.
 * @returns Объект с информацией об аватаре или null, если аватар не найден.
 */
export const getUserAvatar = async (userId: string) => {
  const storage = getStorage();
  const dirRef = storageRef(storage, `userAvatars/${userId}`);
  const res = await listAll(dirRef);

  if (res.items.length > 0) {
    // Предполагаем, что у пользователя только один аватар. Берем первый.
    const firstAvatarRef = res.items[0];
    const url = await getDownloadURL(firstAvatarRef);
    return {
      id: firstAvatarRef.name,
      userId,
      url,
      storagePath: firstAvatarRef.fullPath,
    };
  }

  return null; // Возвращаем null, если в папке пользователя нет файлов
};

/**
 * Загружает аватар салона в Firebase Storage.
 * @param salonId - ID салона.
 * @param file - Файл аватара для загрузки.
 * @returns Объект с информацией о загруженном аватаре.
 */
export const uploadSalonAvatar = async (salonId: string, file: File) => {
  const storage = getStorage();
  const id = `${Date.now()}-${file.name}`;
  const path = `salonAvatars/${salonId}/${id}`;
  const salonAvatarRef = storageRef(storage, path);

  await uploadBytes(salonAvatarRef, file);
  const url = await getDownloadURL(salonAvatarRef);

  return {
    id,
    salonId,
    url,
    storagePath: path,
    uploadedAt: new Date().toISOString(),
  };
};

/**
 * Удаляет аватар салона из Firebase Storage.
 * @param storagePath - Путь к файлу аватара в Storage.
 */
export const deleteSalonAvatar = async (storagePath: string) => {
  if (!storagePath) return;

  const storage = getStorage();
  const salonAvatarRef = storageRef(storage, storagePath);
  try {
    await deleteObject(salonAvatarRef);
  } catch (error: any) {
    if (error.code === 'storage/object-not-found') {
      console.warn(`Salon avatar at path "${storagePath}" not found. Skipping deletion.`);
      return;
    }
    throw error;
  }
};