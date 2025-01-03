import { useCallback, useContext, useEffect, useState } from 'react';
import Giscus from '../components/Giscus';
import { AuthContext, ConfigContext, getLoginUrl } from '../lib/context';
import { emitData } from '../lib/messages';
import { IErrorMessage, IResizeHeightMessage, ISignOutMessage } from '../lib/types/giscus';
import { cleanAnchor } from '../lib/utils';
import { createDiscussion } from '../services/giscus/createDiscussion';
import { getToken } from '../services/giscus/token';

interface IWidgetProps {
  origin: string;
  session: string;
  value: string;
}

export default function Widget({ origin, session, value }: IWidgetProps) {
  const [token, setToken] = useState('');
  const [createDiscussionPromise, setCreateDiscussionPromise] = useState<Promise<string>>();
  const { repo, repoId, categoryId, description, backLink, term, number } =
    useContext(ConfigContext);

  const handleDiscussionCreateRequest = async () => {
    if (createDiscussionPromise) return createDiscussionPromise;

    const promise = createDiscussion(repo, {
      repositoryId: repoId,
      categoryId,
      title: term,
      body: `# ${term}\n\n${description || ''}\n\n${cleanAnchor(backLink || origin)}`,
    });
    setCreateDiscussionPromise(promise);

    return promise;
  };

  const handleError = useCallback(
    (message: string) => {
      emitData<IErrorMessage>({ error: message }, origin);
    },
    [origin],
  );

  const handleSignOut = useCallback(() => {
    emitData<ISignOutMessage & IErrorMessage>(
      {
        signOut: true,
        // HACK: For client scripts that haven't been updated to support sign out,
        // use the error message handler to sign out. Remove this after a reasonable
        // period of time.
        error: 'State has expired (user signed out).',
      },
      origin,
    );
  }, [origin]);

  useEffect(() => {
    if (session && !token) {
      getToken(session)
        .then(setToken)
        .catch((err) => handleError(err?.message));
    }
  }, [handleError, session, token]);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      emitData<IResizeHeightMessage>({ resizeHeight: Math.ceil(entry.contentRect.height) }, origin);
    });

    observer.observe(document.querySelector('body'));
    return () => observer.disconnect();
  }, [origin]);

  const ready = (!session || token) && repo && (term || number);

  return ready ? (
    <AuthContext.Provider value={{ token, origin, getLoginUrl, onSignOut: handleSignOut }}>
      <Giscus
        onDiscussionCreateRequest={handleDiscussionCreateRequest}
        onError={handleError}
        value={value}
      />
    </AuthContext.Provider>
  ) : null;
}
