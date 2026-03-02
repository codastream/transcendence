import { useTranslation } from 'react-i18next';
import Button from '../atoms/Button';

interface ConfirmModalProps {
  title: string;
  text: string;
  validateLabel?: string;
  cancelLabel?: string;
  onValidate: () => void;
  onCancel: () => void;
}

export const ConfirmModal = ({
  title,
  text,
  validateLabel,
  cancelLabel,
  onValidate,
  onCancel,
}: ConfirmModalProps) => {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm flex flex-col gap-4">
        <h2 className="text-lg font-bold text-gray-800 font-quantico">{title}</h2>
        <p className="text-gray-600 text-sm">{text}</p>
        <div className="flex justify-center gap-2">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel ?? t('global.cancel')}
          </Button>
          <Button variant="alert" onClick={onValidate}>
            {validateLabel ?? t('global.confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
};
