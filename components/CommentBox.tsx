import { MarkdownIcon, MarkGithubIcon, SignOutIcon, TypographyIcon } from '@primer/octicons-react';
import { ChangeEvent, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { adaptComment, adaptReply, handleCommentClick, processCommentBody } from '../lib/adapter';
import { AuthContext } from '../lib/context';
import { useGiscusTranslation } from '../lib/i18n';
import { IComment, IReply } from '../lib/types/adapter';
import { resizeTextArea } from '../lib/utils';
import { addDiscussionComment } from '../services/github/addDiscussionComment';
import { addDiscussionReply } from '../services/github/addDiscussionReply';
import { renderMarkdown } from '../services/github/markdown';

interface CommentBoxProps {
  discussionId?: string;
  context?: string;
  replyToId?: string;
  className?: string;
  onSubmit: (comment: IComment | IReply) => void;
  onDiscussionCreateRequest?: () => Promise<string>;
}

export default function CommentBox({
  discussionId,
  context,
  replyToId,
  className = '',
  onSubmit,
  onDiscussionCreateRequest,
}: CommentBoxProps) {
  const { t } = useGiscusTranslation();
  const [isPreview, setIsPreview] = useState(false);
  const [input, setInput] = useState('');
  const [lastInput, setLastInput] = useState('');
  const [preview, setPreview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [isFixedWidth, setIsFixedWidth] = useState(false);
  const [lastHeight, setLastHeight] = useState('');
  const { token, origin, getLoginUrl, onSignOut } = useContext(AuthContext);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const loginUrl = getLoginUrl(origin);
  const isReply = !!replyToId;
  const placeHolderText = isReply ? t('writeAReply') : t('writeAComment');

  useEffect(() => {
    if (isPreview && input !== lastInput) {
      if (input) {
        setIsLoading(true);
        renderMarkdown(input, token, context).then((value) => {
          const processed = processCommentBody(value);
          setPreview(processed);
          setIsLoading(false);
        });
      }
      setLastInput(input);
    }
  }, [isPreview, input, lastInput, token, context]);

  const reset = useCallback(() => {
    setInput('');
    setPreview('');
    setIsPreview(false);
    setIsSubmitting(false);
    setIsReplyOpen(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || (!discussionId && !onDiscussionCreateRequest)) return;
    setIsSubmitting(true);

    const id = discussionId ? discussionId : await onDiscussionCreateRequest();
    const payload = { body: input, discussionId: id, replyToId };

    if (replyToId) {
      addDiscussionReply(payload, token).then(({ data: { addDiscussionReply } }) => {
        const { reply } = addDiscussionReply;
        const adapted = adaptReply(reply);

        onSubmit(adapted);
        reset();
      });
    } else {
      addDiscussionComment(payload, token).then(({ data: { addDiscussionComment } }) => {
        const { comment } = addDiscussionComment;
        const adapted = adaptComment(comment);

        onSubmit(adapted);
        reset();
      });
    }
  }, [
    isSubmitting,
    discussionId,
    input,
    replyToId,
    onDiscussionCreateRequest,
    token,
    onSubmit,
    reset,
  ]);

  const handleReplyOpen = () => {
    setIsReplyOpen(true);
  };

  const handleTextAreaChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      setInput(event.target.value);
      // Only resize if it hasn't been resized manually.
      if (!lastHeight || lastHeight === textarea.current.style.height) {
        resizeTextArea(textarea.current);
        setLastHeight(textarea.current.style.height);
      }
    },
    [lastHeight],
  );

  useEffect(() => {
    if (!textarea.current) return;
    if (isReplyOpen) textarea.current.focus();
  }, [isReplyOpen]);

  return !isReply || isReplyOpen ? (
    <form
      className={`color-bg-primary color-border-primary gsc-comment-box ${
        isReply ? 'gsc-comment-box-is-reply' : ''
      } ${className}`}
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
    >
      <div className="color-bg-tertiary color-border-primary gsc-comment-box-tabs">
        <div className="mx-2 mb-[-1px] mt-2">
          <button
            className={`rounded-t border border-b-0 px-4 py-2 ${
              !isPreview
                ? 'color-text-primary color-bg-canvas color-border-primary'
                : 'color-text-secondary border-transparent'
            }`}
            onClick={() => setIsPreview(false)}
            type="button"
          >
            {t('write')}
          </button>
          <button
            className={`ml-1 rounded-t border border-b-0 px-4 py-2 ${
              isPreview
                ? 'color-text-primary color-bg-canvas color-border-primary'
                : 'color-text-secondary border-transparent'
            }`}
            onClick={() => setIsPreview(true)}
            type="button"
          >
            {t('preview')}
          </button>
        </div>

        {!isPreview ? (
          <div className="gsc-comment-box-md-toolbar">
            <button
              className="gsc-toolbar-item"
              type="button"
              title={isFixedWidth ? t('disableFixedWidth') : t('enableFixedWidth')}
              onClick={() => {
                setIsFixedWidth(!isFixedWidth);
                textarea.current.focus();
              }}
            >
              <TypographyIcon />
            </button>
          </div>
        ) : null}
      </div>
      <div className="gsc-comment-box-main">
        {isPreview ? (
          // The <div> element *might* have a child <button> element from
          // GitHub's markdown renderer result that allows keyboard interaction.
          // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
          <div
            className="markdown color-border-primary gsc-comment-box-preview"
            dangerouslySetInnerHTML={
              isLoading ? undefined : { __html: preview || t('nothingToPreview') }
            }
            onClick={handleCommentClick}
          >
            {isLoading ? t('loadingPreview') : undefined}
          </div>
        ) : (
          <div className="gsc-comment-box-write">
            <textarea
              className={`form-control input-contrast gsc-comment-box-textarea ${
                isFixedWidth ? 'gsc-is-fixed-width' : ''
              }`}
              dir="auto"
              placeholder={token ? placeHolderText : t('signInToComment')}
              onChange={handleTextAreaChange}
              value={input}
              disabled={!token || isSubmitting}
              ref={textarea}
              onKeyDown={(event) =>
                (event.ctrlKey || event.metaKey) && event.key === 'Enter' && handleSubmit()
              }
            ></textarea>
            <div className="form-control input-contrast gsc-comment-box-textarea-extras">
              <a
                className="link-secondary gsc-comment-box-markdown-hint flex gap-2"
                rel="nofollow noopener noreferrer"
                target="_blank"
                href="https://guides.github.com/features/mastering-markdown/"
                title={t('stylingWithMarkdownIsSupported')}
              >
                <MarkdownIcon className="mr-1" />
              </a>
            </div>
          </div>
        )}
      </div>
      <div className="gsc-comment-box-bottom">
        {token && !isReply ? (
          <button type="button" className="link-secondary text-sm" onClick={onSignOut}>
            <SignOutIcon className="mr-2" />
            {t('signOut')}
          </button>
        ) : null}
        <div className="gsc-comment-box-buttons">
          {isReply ? (
            <button
              className="btn ml-1 rounded-md border"
              onClick={() => setIsReplyOpen(false)}
              type="button"
            >
              {t('cancel')}
            </button>
          ) : null}
          {token ? (
            <button
              className="btn btn-primary items-center ml-1 rounded-md border"
              type="submit"
              disabled={(token && !input.trim()) || isSubmitting}
            >
              {isReply ? t('reply') : t('comment')}
            </button>
          ) : (
            <a
              className="btn btn-primary inline-flex items-center ml-1 rounded-md border hover:no-underline"
              target="_top"
              href={loginUrl}
            >
              <MarkGithubIcon className="mr-2" fill="currentColor" /> {t('signInWithGitHub')}
            </a>
          )}
        </div>
      </div>
    </form>
  ) : (
    <div className="color-bg-tertiary gsc-reply-box">
      <button
        className="form-control color-text-secondary color-border-primary w-full cursor-text rounded border px-2 py-1 text-left focus:border-transparent"
        onClick={handleReplyOpen}
        type="button"
      >
        {t('writeAReply')}
      </button>
    </div>
  );
}
