import Link from '@docusaurus/Link';
import type {ReactElement} from 'react';

export default function Footer(): ReactElement {
  return (
    <footer className="site-footer">
      <p style={{opacity: 0.2, paddingBottom: "0.5rem"}}>-</p>
      <Link to="/concepts/contact">Contact</Link>
      <p style={{opacity: 0.2, paddingTop: '1.6rem'}}>-</p>
    </footer>
  );
}
