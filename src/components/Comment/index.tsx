import { useEffect, useRef } from 'react';

export default function Comment(): JSX.Element {
  const reference = useRef<HTMLDivElement>();

  useEffect(() => {
    const scriptElement = document.createElement('script');
    const anchor = document.getElementById('inject-comments-for-uterances');
    scriptElement.src = 'https://utteranc.es/client.js';
    scriptElement.async = true;
    scriptElement.defer = true;
    scriptElement.setAttribute('repo', 'jennifertakagi/spacetravelling');
    scriptElement.setAttribute('crossorigin', 'anonymous');
    scriptElement.setAttribute('theme', 'photon-dark');
    scriptElement.setAttribute('issue-term', 'pathname');
    scriptElement.setAttribute('label', 'blog-comment');
    anchor.appendChild(scriptElement);
  }, []);

  return (
    <div id="inject-comments-for-uterances">
      <div ref={reference} />
    </div>
  );
}
