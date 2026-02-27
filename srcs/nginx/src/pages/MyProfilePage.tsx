import Toggle from '../components/atoms/Toggle';
import FileUploader from '../components/molecules/FileUploader';
import { Page } from '../components/organisms/PageContainer';
import Avatar from '../components/atoms/Avatar';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../api/profile-api';
import { useRef, useState } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useTranslation } from 'react-i18next';
import { Pencil } from 'lucide-react';
import { Input } from '../components/atoms/Input';
import Button from '../components/atoms/Button';
import { AppError, ERROR_CODES, FrontendError } from '@transcendence/core';

const toggle2FA = () => {};

/**
 * MyProfilePage — Page privée accessible uniquement via /me.
 *
 * Responsabilités :
 * - Affiche les informations personnelles de l'utilisateur connecté
 * - Permet la modification du profil (avatar, 2FA, etc.)
 *
 * Guard : PrivateRoute redirige vers /welcome si non connecté.
 */
export const MyProfilePage = () => {
  const queryClient = useQueryClient();
  const { user: authUser, updateUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const username = authUser?.username || '';

  const {
    data: profile,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => profileApi.getMe(username),
    enabled: !!username,
  });

  console.log('profile data:', profile);
  console.log('isLoading:', isLoading);
  console.log('isError:', isError);

  const { mutate: updateUsername, isPending } = useMutation({
    mutationFn: (newUsername: string) => profileApi.updateUsername(username, newUsername),
    onMutate: () => {
      setError(null);
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(['profile', 'me'], updatedProfile);
      updateUser({
        ...authUser,
        username: updatedProfile.username,
        avatarUrl: authUser?.avatarUrl ?? null,
      });
      setIsEditing(false);
    },
    onError: (error) => {
      if (error instanceof FrontendError) {
        setError(error.message);
      } else {
        setError(t(ERROR_CODES.INTERNAL_ERROR));
      }
    },
  });

  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  if (isLoading) {
    return (
      <Page>
        <div>{t('global.loading')}</div>
      </Page>
    );
  }

  if (isError || !profile || username === '') {
    return (
      <Page>
        <div>{t('global.not_found')}</div>
      </Page>
    );
  }

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const updatedProfile = await profileApi.updateAvatar(username, file, (p: number) =>
        setProgress(p),
      );
      queryClient.setQueryData(['profile', 'me'], updatedProfile);
      if (authUser) {
        updateUser({
          ...authUser,
          avatarUrl: updatedProfile.avatarUrl,
        });
      }
    } catch (error: unknown) {
      if (error instanceof AppError) {
        setError(error.message);
      } else {
        setError(ERROR_CODES.INTERNAL_ERROR);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Page className="flex flex-col">
      <div className="flex flex-col gap-4">
        {/* Section profil */}
        <div className="mb-3">
          <h1 className="m-2 text-gray-600 font-bold text-xl font-quantico">
            {t('profile.profile')}
          </h1>
          <div className="flex flex-col items-center">
            <Avatar src={profile.avatarUrl} size="lg"></Avatar>

            {isEditing ? (
              <div className="mt-4">
                <h1 className="mb-2 text-gray-600 font-bold text-xl font-quantico">
                  {t('profile.update_username')}
                </h1>
                <div className="flex flex-row justify-between items-center gap-2">
                  <Input
                    ref={inputRef}
                    defaultValue={profile.username}
                    className="h-20 border p-1"
                    disabled={isPending}
                  ></Input>
                  <Button
                    onClick={() => {
                      const newValue = inputRef.current?.value;
                      if (newValue && newValue !== profile.username) {
                        updateUsername(newValue);
                      }
                    }}
                    variant="primary"
                    type="submit"
                    className="px-2 py-2"
                    disabled={isPending}
                  >
                    {t('global.save')}
                  </Button>
                  <Button
                    onClick={() => setIsEditing(false)}
                    variant="secondary"
                    type="submit"
                    className="px-2 py-2"
                  >
                    {t('global.cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-row justify-between items-center align-middle mt-4">
                <p className="mr-3 ts-form-title">{profile.username}</p>
                <Pencil
                  className="cursor-pointer"
                  color="white"
                  onClick={() => setIsEditing(true)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Section 2FA */}
        <div className="mb-3">
          <h1 className="m-2 text-gray-600 font-bold text-xl font-quantico">{t('profile.2fa')}</h1>
          <div className="flex flex-row justify-center">
            <Toggle onToggle={toggle2FA} className="mr-3"></Toggle>
            <label htmlFor="Toggle" className="text-gray-600">
              {t('global.disabled')}
            </label>
          </div>
        </div>

        {/* Section upload avatar */}
        <div className="mb-3">
          <h1 className="m-2 text-gray-600 font-bold text-xl font-quantico">
            {t('profile.update_avatar')}
          </h1>
          <div className="flex flex-row justify-center">
            <FileUploader onFileSelect={handleUpload}></FileUploader>
          </div>
          {isUploading && (
            <div className="w-full bg-gray-200 h-2 mt-4">
              <div
                className="bg-blue-600 h-2 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {error && <p className="text-red-600">{error}</p>}
      </div>
    </Page>
  );
};
