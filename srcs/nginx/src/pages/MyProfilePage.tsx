import FileUploader from '../components/molecules/FileUploader';
import { Page } from '../components/organisms/PageContainer';
import { TwoFactorSetup } from '../components/organisms/TwoFactorSetup';
import Avatar from '../components/atoms/Avatar';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../api/profile-api';
import { useState } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useTranslation } from 'react-i18next';
import Button from '../components/atoms/Button';
import { AppError, ERROR_CODES, FrontendError } from '@transcendence/core';
import { authApi } from '../api/auth-api';
import { ConfirmModal } from '../components/molecules/ConfirmModal';
import { EditableField } from '../components/molecules/EditableField';

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
  const { user: authUser, updateUser, logout } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  const username = authUser?.username || '';
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const {
    data: profile,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => profileApi.getMe(username),
    enabled: !!username,
  });

  const { mutate: updateUsername, isPending: isPendingUsername } = useMutation({
    mutationFn: (newUsername: string) => authApi.updateUsername(username, newUsername),
    onMutate: () => {
      setError(null);
      setUsernameError(null);
    },
    onSuccess: (updatedProfile) => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      updateUser({
        ...authUser,
        username: updatedProfile.username,
        avatarUrl: authUser?.avatarUrl ?? null,
      });
    },
    onError: (error) => {
      if (error instanceof FrontendError) {
        setError(error.message);
      } else {
        setError(t(ERROR_CODES.INTERNAL_ERROR));
      }
    },
  });

  const { mutate: updateEmail, isPending: isPendingEmail } = useMutation({
    mutationFn: (newEmail: string) => authApi.updateEmail(username, newEmail),
    onMutate: () => {
      setError(null);
      setEmailError(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error) => {
      if (error instanceof FrontendError) {
        setEmailError(error.message);
      } else {
        setEmailError(t(ERROR_CODES.INTERNAL_ERROR));
      }
    },
  });

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

  const handleDelete = async () => {
    try {
      await authApi.deleteUser();
      logout();
    } catch (error: unknown) {
      if (error instanceof AppError) {
        setError(error.message);
      } else {
        setError(ERROR_CODES.INTERNAL_ERROR);
      }
    }
  };

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

            <EditableField
              label={t('profile.update_username')}
              value={profile.username}
              error={usernameError}
              isPending={isPendingUsername}
              onSave={updateUsername}
            />

            <EditableField
              label={t('profile.update_email')}
              value={profile.email}
              error={emailError}
              isPending={isPendingEmail}
              onSave={updateEmail}
            />
          </div>
        </div>

        {/* Section 2FA */}
        <div className="mb-3">
          <h1 className="m-2 text-gray-600 font-bold text-xl font-quantico">{t('profile.2fa')}</h1>
          <TwoFactorSetup />
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

        {/* Section delete profile */}
        <div className="mb-3">
          <h1 className="m-2 text-gray-600 font-bold text-xl font-quantico">
            {t('profile.delete')}
          </h1>
          <div className="flex flex-row justify-center">
            <Button type="submit" variant="alert" onClick={() => setShowDeleteModal(true)}>
              {t('profile.delete')}
            </Button>
          </div>
        </div>

        {showDeleteModal && (
          <ConfirmModal
            title={t('profile.delete_confirm_title')}
            text={t('profile.delete_confirm_text')}
            onValidate={() => {
              setShowDeleteModal(false);
              handleDelete();
            }}
            onCancel={() => setShowDeleteModal(false)}
          />
        )}

        {error && <p className="text-red-600">{error}</p>}
      </div>
    </Page>
  );
};
