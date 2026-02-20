import { ProfileSimpleDTO } from '@transcendence/core';
import { Search, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SearchProps {
  value: string;
  onChange: (val: string) => void;
  suggestions: ProfileSimpleDTO[];
  error?: string | null;
  onSelect: (user: ProfileSimpleDTO) => void;
  isLoading: boolean;
}

const UserSearchInput = ({
  value,
  onChange,
  suggestions,
  error,
  onSelect,
  isLoading = false,
}: SearchProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-0 p-3 bg-black/10 rounded-2xl">
      <div className="flex items-center justify-between gap-2 border-white/50 p-1">
        <input
          className="bg-transparent outline-none text-white placeholder:text-gray-500 placeholder:text-md lg:placeholder:text-md"
          placeholder={t('search.user')}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {isLoading ? (
          <Loader size={18} className="text-white mr-1 animate-spin" />
        ) : (
          <Search size={18} className="text-white mr-1" />
        )}
      </div>

      <ul className="flex flex-col gap-1">
        {suggestions.map((u) => (
          <li
            role="button"
            key={u.username}
            onClick={() => onSelect(u)}
            className="cursor-pointer hover:bg-white/10 p-1 rounded"
          >
            {u.username}
          </li>
        ))}
        {error && <li className="text-red-400 italic text-sm">{error}</li>}
      </ul>
    </div>
  );
};

export default UserSearchInput;
