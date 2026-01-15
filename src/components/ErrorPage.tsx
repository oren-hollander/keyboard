import './ErrorPage.css';

export function ErrorPage() {
  return (
    <div className="error-page">
      <h1>Invalid URL</h1>
      <p>To join a chat, use a URL in this format:</p>
      <code>/keyboard/&lt;conversation-token&gt;/&lt;username&gt;</code>
      <p className="example">Example: /keyboard/my-chat-room/Oren</p>
    </div>
  );
}
