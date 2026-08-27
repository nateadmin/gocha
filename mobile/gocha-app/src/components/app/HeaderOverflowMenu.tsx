import { AnimatedHamburgerMenu } from './AnimatedHamburgerMenu';
import { DropdownMenu, type DropdownMenuItem } from './DropdownMenu';

type Props = {
  open: boolean;
  menuTop: number;
  items: DropdownMenuItem[];
  onPress: () => void;
  onClose: () => void;
  anchor?: 'right' | 'left';
  accessibilityLabel?: string;
  size?: number;
  strokeColor?: string;
};

/** Animated header overflow control: hamburger button + themed dropdown panel. */
export function HeaderOverflowMenu({
  open,
  menuTop,
  items,
  onPress,
  onClose,
  anchor = 'right',
  accessibilityLabel = 'Open menu',
  size = 40,
  strokeColor,
}: Props) {
  return (
    <>
      <AnimatedHamburgerMenu
        open={open}
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        strokeColor={strokeColor}
        size={size}
      />
      <DropdownMenu
        visible={open}
        anchor={anchor}
        items={items}
        menuTop={menuTop}
        onClose={onClose}
      />
    </>
  );
}

export type { DropdownMenuItem };
