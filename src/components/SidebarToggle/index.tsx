import {useEffect, useState, type ReactElement} from 'react';
import {createPortal} from 'react-dom';
import {useLocation} from '@docusaurus/router';

const HIDDEN_CLASS = 'doc-sidebar-hidden';

const SIDEBAR_MENU_SELECTOR = '.theme-doc-sidebar-menu';
const SIDEBAR_CONTAINER_SELECTOR = '.theme-doc-sidebar-container';

export default function SidebarToggle(): ReactElement | null {
  const [isHidden, setIsHidden] = useState(false);
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);
  const location = useLocation();

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    const root = document.documentElement;
    root.classList.toggle(HIDDEN_CLASS, isHidden);

    return () => {
      root.classList.remove(HIDDEN_CLASS);
    };
  }, [isHidden]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      setPortalNode(null);
      return undefined;
    }

    const menuList = document.querySelector(SIDEBAR_MENU_SELECTOR) as HTMLElement | null;
    const sidebarContainer = document.querySelector(
      SIDEBAR_CONTAINER_SELECTOR,
    ) as HTMLElement | null;

    if (!sidebarContainer || !menuList) {
      setPortalNode(null);
      return undefined;
    }

    sidebarContainer.classList.add('sidebarToggleEnabled');

    const wrapper = document.createElement('div');
    wrapper.className = 'sidebarToggleButtonWrapper';
    menuList.parentElement?.insertBefore(wrapper, menuList);
    setPortalNode(wrapper);

    return () => {
      sidebarContainer.classList.remove('sidebarToggleEnabled');
      wrapper.remove();
      setPortalNode(null);
    };
  }, [location.pathname]);

  const button = (
    <button
      type="button"
      className="sidebarToggleButton"
      aria-label={isHidden ? 'Show menu' : 'Hide menu'}
      title={isHidden ? 'Show menu' : 'Hide menu'}
      onClick={() => setIsHidden((prev) => !prev)}>
      <span aria-hidden="true">{isHidden ? '→' : '←'}</span>
    </button>
  );

  if (portalNode) {
    return createPortal(button, portalNode);
  }

  return button;
}
