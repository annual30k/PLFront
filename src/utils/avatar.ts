import defAva from '@/assets/images/profile.jpg';

const absoluteUrlPattern = /^https?:\/\//i;
const dataUrlPattern = /^data:image\//i;
const numericPattern = /^\d+$/;
const apiBase = import.meta.env.VITE_APP_BASE_API || '';

const withApiBase = (path: string): string => {
  if (!apiBase || path.startsWith(apiBase + '/')) {
    return path;
  }
  return `${apiBase}${path}`;
};

export const resolveAvatarUrl = (avatar?: string | number | null): string => {
  if (avatar === undefined || avatar === null || avatar === '') {
    return defAva;
  }

  const value = String(avatar).trim();
  if (!value) {
    return defAva;
  }

  if (absoluteUrlPattern.test(value) || dataUrlPattern.test(value)) {
    return value;
  }

  if (numericPattern.test(value)) {
    return withApiBase(`/resource/oss/download/${value}`);
  }

  if (value.startsWith('/resource/')) {
    return withApiBase(value);
  }

  return value;
};

export const defaultAvatarUrl = defAva;
