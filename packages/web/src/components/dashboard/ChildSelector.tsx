import { Child } from '@/hooks/useChildren';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Users } from 'lucide-react';

interface ChildSelectorProps {
  children: Child[];
  selectedId?: string;
  onSelect: (id: string) => void;
  showAllOption?: boolean;
}

export const ChildSelector = ({
  children,
  selectedId,
  onSelect,
  showAllOption = true,
}: ChildSelectorProps) => {
  const isAllSelected = selectedId === 'all';

  return (
    <Select value={selectedId} onValueChange={onSelect}>
      <SelectTrigger className="w-[200px]">
        <div className="flex items-center gap-2">
          {isAllSelected ? <Users className="h-4 w-4" /> : <User className="h-4 w-4" />}
          <SelectValue placeholder="Select child" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {showAllOption && children.length > 1 && (
          <SelectItem value="all" className="font-medium">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              All Children ({children.length})
            </div>
          </SelectItem>
        )}
        {children.map((child) => (
          <SelectItem key={child.id} value={child.id}>
            {child.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
