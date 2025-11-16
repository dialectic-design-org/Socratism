import {useEffect, useRef} from 'react';
import {useColorMode} from '@docusaurus/theme-common';
import type {ColorMode} from '@docusaurus/theme-common';

export default function ForceDarkMode(): null {
  const {colorMode, colorModeChoice, setColorMode: originalSetColorMode} = useColorMode();
  const savedChoice = useRef<ColorMode | null>(colorModeChoice);
  const isForcingDark = useRef(false);
  const componentId = useRef(Math.random().toString(36).substring(7));

  const setColorMode = (mode: ColorMode | null) => {
    console.log(`[ForceDarkMode ${componentId.current}] setColorMode called with:`, mode);
    console.trace(`[ForceDarkMode ${componentId.current}] Stack trace for setColorMode call`);
    originalSetColorMode(mode);
  };

  console.log(`[ForceDarkMode ${componentId.current}] Render - Current state:`, {
    colorMode,
    colorModeChoice,
    savedChoice: savedChoice.current,
    isForcingDark: isForcingDark.current,
  });

  useEffect(() => {
    console.log(`[ForceDarkMode ${componentId.current}] COMPONENT MOUNTED`);
    return () => {
      console.log(`[ForceDarkMode ${componentId.current}] COMPONENT UNMOUNTED`);
    };
  }, []);

  useEffect(() => {
    if (!isForcingDark.current) {
      console.log(`[ForceDarkMode ${componentId.current}] Saving choice:`, colorModeChoice);
      savedChoice.current = colorModeChoice;
    }
  }, [colorModeChoice]);

  useEffect(() => {
    if (colorMode !== 'dark') {
      console.log(
        `[ForceDarkMode ${componentId.current}] Forcing dark mode, current mode:`,
        colorMode,
      );
      console.trace(`[ForceDarkMode ${componentId.current}] Stack trace for forcing dark mode`);
      isForcingDark.current = true;
      setColorMode('dark');
    } else if (isForcingDark.current) {
      console.log(`[ForceDarkMode ${componentId.current}] Dark mode applied, clearing forcing flag`);
      isForcingDark.current = false;
    }
  }, [colorMode, setColorMode]);

  useEffect(() => {
    console.log(`[ForceDarkMode ${componentId.current}] Cleanup effect registered`);
    return () => {
      console.log(
        `[ForceDarkMode ${componentId.current}] CLEANUP RUNNING - Unmounting, restoring choice:`,
        savedChoice.current,
      );
      console.trace(`[ForceDarkMode ${componentId.current}] Stack trace for cleanup`);
      setColorMode(savedChoice.current);
      isForcingDark.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
