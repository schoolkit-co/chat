import { Ticket } from 'lucide-react';
import * as Select from '@ariakit/react/select';
import { useLocalize } from '~/hooks';

interface CouponMenuItemProps {
  onClick: () => void;
}

export const CouponMenuItem = ({ onClick }: CouponMenuItemProps) => {
  const localize = useLocalize();
  
  return (
    <Select.SelectItem
      value=""
      title="แลกคูปอง"
      onClick={onClick}
      className="select-item text-sm"
    >
      <Ticket className="icon-md" aria-hidden="true" />
      คูปอง
    </Select.SelectItem>
  );
};
