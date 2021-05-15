import { readFileSync } from 'fs';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { join } from 'path';
import Comment from '../components/Comment';
import { Reactions } from '../lib/reactions';
import { IComment, IReactionGroups } from '../lib/types/adapter';
import { renderMarkdown } from '../services/github/markdown';
import { getAppAccessToken } from '../services/github/getAppAccessToken';
import { useIsMounted } from '../lib/hooks';
import Configuration from '../components/Configuration';
import { useContext } from 'react';
import { ThemeContext } from '../lib/context';

export const getStaticProps = async () => {
  const path = join(process.cwd(), 'README.md');
  const readme = readFileSync(path, 'utf-8');
  const token = await getAppAccessToken('laymonage/giscus');
  const content = await renderMarkdown(readme, token, 'laymonage/giscus');
  return {
    props: {
      content,
    },
  };
};

export default function Home({ content }: { content: string }) {
  const isMounted = useIsMounted();
  const router = useRouter();
  const { theme } = useContext(ThemeContext);

  const comment: IComment = {
    author: {
      avatarUrl: 'https://avatars.githubusercontent.com/in/106117',
      login: 'giscus',
      url: 'https://github.com/apps/giscus',
    },
    authorAssociation: 'app',
    bodyHTML: content,
    createdAt: '2021-05-15T13:21:14Z',
    deletedAt: null,
    id: 'onboarding',
    isMinimized: false,
    lastEditedAt: null,
    reactions: Object.keys(Reactions).reduce(
      (prev, key) => ({ ...prev, [key]: { count: 0, viewerHasReacted: false } }),
      {},
    ) as IReactionGroups,
    replies: [],
    replyCount: 0,
    upvoteCount: 0,
    url: 'https://github.com/laymonage/giscus',
    viewerDidAuthor: false,
    viewerHasUpvoted: false,
    viewerCanUpvote: false,
  };

  return (
    <main className="w-full min-h-screen color-bg-canvas" data-theme={theme}>
      <div className="w-full max-w-3xl p-2 mx-auto color-text-primary">
        {isMounted ? (
          <>
            <Comment comment={comment}>
              <Configuration />
            </Comment>

            <div className="w-full my-8 giscus color-bg-canvas">
              <style jsx>
                {`
                  :global(.giscus-frame) {
                    width: 100%;
                    color-scheme: auto;
                  }
                `}
              </style>
            </div>
            {router.isReady ? (
              <Head>
                <script
                  src="/client.js"
                  data-repo="laymonage/giscus"
                  data-repo-id="MDEwOlJlcG9zaXRvcnkzNTE5NTgwNTM="
                  data-category-id="MDE4OkRpc2N1c3Npb25DYXRlZ29yeTMyNzk2NTc1"
                  data-mapping="specific"
                  data-term="Welcome to giscus!"
                  data-theme={theme}
                ></script>
              </Head>
            ) : null}
          </>
        ) : null}
      </div>
    </main>
  );
}
