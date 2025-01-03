import { CheckIcon, CopyIcon, SyncIcon, XIcon } from '@primer/octicons-react';
import { useEffect, useState } from 'react';
import { handleClipboardCopy } from '../lib/adapter';
import { useDebounce } from '../lib/hooks';
import {
  AvailableLanguage,
  availableLanguages,
  ConfigI18n,
  Trans,
  useGiscusTranslation,
} from '../lib/i18n';
import { ICategory } from '../lib/types/adapter';
import { InputPosition } from '../lib/types/giscus';
import { normalizeRepoName } from '../lib/utils';
import { availableThemes, env, Theme } from '../lib/variables';
import { getCategories } from '../services/giscus/categories';

interface IDirectConfig {
  theme: Theme;
  themeUrl: Theme;
  reactionsEnabled: boolean;
  emitMetadata: boolean;
  inputPosition: InputPosition;
  lang: AvailableLanguage;
}

interface IConfigurationProps {
  directConfig: IDirectConfig;
  onDirectConfigChange: (
    key: keyof IDirectConfig,
    value: IDirectConfig[keyof IDirectConfig],
  ) => void;
}

type Mapping = 'pathname' | 'url' | 'title' | 'og:title' | 'specific' | 'number';

interface IConfig {
  repository: string;
  repositoryId: string;
  mapping: Mapping;
  term: string;
  category: string;
  categoryId: string;
  strict: boolean;
  useCategory: boolean;
  lazyLoad: boolean;
  basePath: string;
}

const mappingOptions: Array<{
  value: Mapping;
  label: keyof ConfigI18n;
  description: keyof ConfigI18n;
}> = [
  {
    value: 'pathname',
    label: 'titleContainsPathname',
    description: 'titleContainsPathnameDesc',
  },
  {
    value: 'url',
    label: 'titleContainsURL',
    description: 'titleContainsURLDesc',
  },
  {
    value: 'title',
    label: 'titleContainsTitle',
    description: 'titleContainsTitleDesc',
  },
  {
    value: 'og:title',
    label: 'titleContainsOgTitle',
    description: 'titleContainsOgTitleDesc',
  },
  {
    value: 'specific',
    label: 'titleContainsSpecificTerm',
    description: 'titleContainsSpecificTermDesc',
  },
  {
    value: 'number',
    label: 'specificDiscussionNumber',
    description: 'specificDiscussionNumberDesc',
  },
];

function ClipboardCopy() {
  const { t } = useGiscusTranslation('config');
  return (
    <div className="zeroclipboard-container position-absolute right-0 top-0">
      <button
        aria-label={t('copy')}
        className="ClipboardButton btn js-clipboard-copy tooltipped-no-delay m-2 p-0"
        data-copy-feedback="Copied!"
        tabIndex={0}
        onClick={handleClipboardCopy}
      >
        <CopyIcon className="octicon octicon-copy js-clipboard-copy-icon m-2" />
        <CheckIcon className="octicon octicon-check js-clipboard-check-icon color-text-success d-none m-2" />
      </button>
    </div>
  );
}

export default function Configuration({ directConfig, onDirectConfigChange }: IConfigurationProps) {
  const [config, setConfig] = useState<IConfig>({
    repository: '',
    repositoryId: '',
    mapping: 'pathname',
    term: '',
    category: '',
    categoryId: '',
    strict: false,
    useCategory: true,
    lazyLoad: false,
    basePath: '',
  });
  const [error, setError] = useState(false);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const dRepository = normalizeRepoName(useDebounce(config.repository));
  const { t, dir } = useGiscusTranslation('config');

  useEffect(() => {
    setError(false);
    setConfig((current) => ({ ...current, repositoryId: '', category: '', categoryId: '' }));
    setCategories([]);
    if (dRepository) {
      getCategories(dRepository)
        .then(({ repositoryId, categories }) => {
          setConfig((current) => ({ ...current, repositoryId }));
          setCategories(categories);
        })
        .catch(() => {
          setError(true);
        });
    }
  }, [dRepository]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { data } = event;
      if (!(typeof data === 'object' && data?.giscus?.discussion)) return;
      console.log(data);
    };

    if (directConfig.emitMetadata) {
      window.addEventListener('message', handleMessage);
    }
    return () => window.removeEventListener('message', handleMessage);
  }, [directConfig.emitMetadata]);

  return (
    <div dir={dir} className="markdown p-4 pt-0">
      <h2>{t('configuration')}</h2>

      <h3>{t('language')}</h3>
      <p>
        <Trans
          i18nKey="config:chooseLanguageGiscusDisplayed"
          components={{
            a: (
              <a
                href="https://github.com/giscus/giscus/blob/main/CONTRIBUTING.md#adding-localizations"
                target="_blank"
                rel="noreferrer noopener nofollow"
              />
            ),
          }}
        />
      </p>
      <label htmlFor="language" className="sr-only">
        {t('language')}
      </label>
      <select
        name="language"
        id="language"
        value={directConfig.lang}
        onChange={(event) => onDirectConfigChange('lang', event.target.value as AvailableLanguage)}
        className="form-control form-select color-border-primary color-bg-primary appearance-none bg-no-repeat rounded-md border px-[12px] py-[5px] pr-6"
      >
        {Object.entries(availableLanguages).map(([value, name]) => (
          <option key={value} value={value}>
            {name}
          </option>
        ))}
      </select>

      <h3>{t('repository')}</h3>
      <p>{t('chooseTheRepository')}</p>
      <ol>
        <li>
          <Trans
            i18nKey="config:theRepositoryIsPublic"
            components={{
              a: (
                <a
                  href="https://docs.github.com/en/github/administering-a-repository/managing-repository-settings/setting-repository-visibility#making-a-repository-public"
                  target="_blank"
                  rel="noreferrer noopener nofollow"
                />
              ),
            }}
          />
        </li>
        <li>
          <Trans
            i18nKey="config:theGiscusAppIsInstalled"
            components={{
              a: (
                <a
                  href="https://github.com/apps/giscus"
                  target="_blank"
                  rel="noreferrer noopener nofollow"
                />
              ),
            }}
          />
        </li>
        <li>
          <Trans
            i18nKey="config:theDiscussionsFeatureIsTurnedOn"
            components={{
              a: (
                <a
                  href="https://docs.github.com/en/github/administering-a-repository/managing-repository-settings/enabling-or-disabling-github-discussions-for-a-repository"
                  target="_blank"
                  rel="noreferrer noopener nofollow"
                />
              ),
            }}
          />
        </li>
      </ol>
      <fieldset>
        <label htmlFor="repository" className="block font-semibold">
          {t('repositoryLabel')}
        </label>
        <input
          id="repository"
          value={config.repository}
          onChange={(event) =>
            setConfig((current) => ({ ...current, repository: event.target.value }))
          }
          type="text"
          className="form-control min-w-[75%] placeholder-gray-500 my-2 rounded-md border px-[12px] py-[5px] sm:min-w-[50%]"
          placeholder={t('myusername/myrepo')}
        />

        {error || (config.repositoryId && !categories.length) ? (
          <>
            <XIcon className="color-text-danger inline-block ml-2" />
            <p className="color-text-danger text-xs">{t('cannotUseGiscusOnThisRepository')}</p>
          </>
        ) : config.repositoryId && categories.length ? (
          <>
            <CheckIcon className="color-text-success inline-block ml-2" />
            <p className="color-text-success text-xs">{t('successRepositoryMeetsCriteria')}</p>
          </>
        ) : (
          <>
            {!error && !config.repositoryId && dRepository ? (
              <SyncIcon className="inline-block animate-spin ml-2" />
            ) : null}
            <p className="color-text-secondary text-xs">
              <Trans i18nKey="config:aPublicGitHubRepository" />
            </p>
          </>
        )}
      </fieldset>

      <h3>{t('pageDiscussionsMapping')}</h3>
      <p>{t('chooseTheMapping')}</p>
      <fieldset>
        {mappingOptions.map(({ value, label, description }) => (
          <div key={value} className="form-checkbox mt-4 first:mt-0">
            <input
              id={value}
              className="mt-[3.5px]"
              type="radio"
              name="mapping"
              value={value}
              checked={config.mapping === value}
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  term: '',
                  mapping: event.target.value as Mapping,
                }))
              }
            />
            <label className="cursor-pointer" htmlFor={value}>
              <strong>
                {}
                <Trans i18nKey={`config:${label}`} />
              </strong>
            </label>
            <p className="color-text-secondary text-xs mb-0">
              <Trans
                i18nKey={`config:${description}`}
                components={{
                  aOgTitle: (
                    <a href="https://ogp.me" target="_blank" rel="noreferrer noopener nofollow" />
                  ),
                }}
              />
            </p>
            {['specific', 'number'].includes(config.mapping) && config.mapping === value ? (
              <input
                id="term"
                value={config.term}
                onChange={(event) =>
                  setConfig((current) => ({ ...current, term: event.target.value }))
                }
                type={config.mapping === 'number' ? 'number' : 'text'}
                className="form-control min-w-[75%] placeholder-gray-500 mt-4 rounded-md border px-[12px] py-[5px] sm:min-w-[50%]"
                placeholder={
                  config.mapping === 'number' ? t('enterDiscussionNumberHere') : t('enterTermHere')
                }
              />
            ) : null}
          </div>
        ))}
      </fieldset>
      <p>{t('defineBasePath')}</p>
      <fieldset>
        <label htmlFor="basePath" className="block font-semibold">
          {t('basePathLabel')}
        </label>
        <input
          id="basePath"
          value={config.basePath}
          onChange={(event) =>
            setConfig((current) => ({ ...current, basePath: event.target.value }))
          }
          type="text"
          className="form-control min-w-[75%] placeholder-gray-500 my-2 rounded-md border px-[12px] py-[5px] sm:min-w-[50%]"
          placeholder={t('/my/custom/basepath')}
        />
      </fieldset>
      <div className="form-checkbox">
        <input
          disabled={config.mapping === 'number'}
          type="checkbox"
          id="strict"
          checked={config.strict}
          onChange={(event) =>
            setConfig((current) => ({ ...current, strict: event.target.checked }))
          }
        ></input>
        <label htmlFor="strict">
          <strong>{t('useStrictTitleMatching')}</strong>
        </label>
        <p className="color-text-secondary text-xs mb-0">
          <Trans
            i18nKey="config:avoidMismatches"
            components={{
              a: (
                <a
                  href="https://github.com/giscus/giscus/blob/main/ADVANCED-USAGE.md#data-strict"
                  target="_blank"
                  rel="noreferrer noopener nofollow"
                />
              ),
            }}
          />
        </p>
      </div>

      <h3>{t('discussionCategory')}</h3>
      <p>
        {t('chooseTheDiscussionCategory')}{' '}
        <Trans
          i18nKey={
            config.mapping === 'number'
              ? 'config:categoryIsNotSupported'
              : 'config:recommendAnnouncementsCategory'
          }
        />
      </p>
      <label htmlFor="category" className="sr-only">
        {t('discussionCategoryLabel')}
      </label>
      <select
        name="category"
        id="category"
        disabled={!categories.length || config.mapping === 'number'}
        value={config.categoryId}
        onChange={(event) =>
          setConfig((current) => ({
            ...current,
            category: event.target.selectedOptions[0]?.dataset.category,
            categoryId: event.target.value,
          }))
        }
        className={`form-control form-select color-border-primary min-w-[200px] appearance-none bg-no-repeat rounded-md border px-[12px] py-[5px] pr-6 color-bg-primary${
          !config.categoryId ? ' color-text-secondary' : ''
        }`}
      >
        <option value="" disabled data-category="">
          {config.mapping === 'number'
            ? t('categoryNotSupportedOption')
            : categories.length
              ? t('pickACategoryOption')
              : t('noCategoriesFoundOption')}
        </option>
        {categories.map(({ id, emoji, name }) => (
          <option key={id} value={id} className="color-text-primary" data-category={name}>
            {emoji} {name}
          </option>
        ))}
      </select>
      <div className="form-checkbox">
        <input
          disabled={config.mapping === 'number'}
          type="checkbox"
          id="useCategory"
          checked={config.useCategory}
          value={config.category}
          onChange={(event) =>
            setConfig((current) => ({ ...current, useCategory: event.target.checked }))
          }
        ></input>
        <label htmlFor="useCategory">
          <strong>{t('onlySearchInThisCategory')}</strong>
        </label>
        <p className="color-text-secondary text-xs mb-0">{t('whenSearchingOnlyThisCategory')}</p>
      </div>

      <h3>{t('features')}</h3>
      <p>{t('chooseSpecificFeatures')}</p>
      <div className="form-checkbox">
        <input
          type="checkbox"
          id="reactionsEnabled"
          checked={directConfig.reactionsEnabled}
          value={`${+directConfig.reactionsEnabled}`}
          onChange={(event) => onDirectConfigChange('reactionsEnabled', event.target.checked)}
        ></input>
        <label htmlFor="reactionsEnabled">
          <strong>{t('enableReactionsMainPost')}</strong>
        </label>
        <p className="color-text-secondary text-xs mb-0">
          {t('reactionsMainPostShownBeforeComments')}
        </p>
      </div>
      <div className="form-checkbox">
        <input
          type="checkbox"
          id="emitMetadata"
          checked={directConfig.emitMetadata}
          value={`${+directConfig.emitMetadata}`}
          onChange={(event) => onDirectConfigChange('emitMetadata', event.target.checked)}
        ></input>
        <label htmlFor="emitMetadata">
          <strong>{t('emitDiscussionMetadata')}</strong>
        </label>
        <p className="color-text-secondary text-xs mb-0">
          <Trans
            i18nKey="config:discussionMetadataSentPeriodically"
            components={{
              a: (
                <a
                  href="https://github.com/giscus/giscus/blob/main/ADVANCED-USAGE.md#imetadatamessage"
                  target="_blank"
                  rel="noreferrer noopener nofollow"
                />
              ),
            }}
          />
        </p>
      </div>
      <div className="form-checkbox">
        <input
          type="checkbox"
          id="inputPosition"
          checked={directConfig.inputPosition === 'top'}
          value={directConfig.inputPosition}
          onChange={(event) =>
            onDirectConfigChange('inputPosition', event.target.checked ? 'top' : 'bottom')
          }
        ></input>
        <label htmlFor="inputPosition">
          <strong>{t('placeCommentBoxAboveComments')}</strong>
        </label>
        <p className="color-text-secondary text-xs mb-0">
          {t('commentInputBoxWillBePlacedAboveComments')}
        </p>
      </div>
      <div className="form-checkbox">
        <input
          type="checkbox"
          id="lazyLoad"
          checked={config.lazyLoad}
          onChange={(event) =>
            setConfig((current) => ({ ...current, lazyLoad: event.target.checked }))
          }
        ></input>
        <label htmlFor="lazyLoad">
          <strong>{t('loadCommentsLazily')}</strong>
        </label>
        <p className="color-text-secondary text-xs mb-0">
          <Trans
            i18nKey="config:loadingCommentsWillBeDeferred"
            components={{
              a: (
                <a
                  href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-loading"
                  target="_blank"
                  rel="noreferrer noopener nofollow"
                />
              ),
            }}
          />
        </p>
      </div>

      <h3>{t('theme')}</h3>
      <p>
        <Trans
          i18nKey="config:chooseAThemeThatMatches"
          components={{
            a: (
              <a
                href="https://github.com/giscus/giscus/blob/main/CONTRIBUTING.md#creating-new-themes"
                target="_blank"
                rel="noreferrer noopener nofollow"
              />
            ),
          }}
        />
      </p>
      <label htmlFor="theme" className="sr-only">
        {t('theme')}
      </label>
      <select
        name="theme"
        id="theme"
        value={directConfig.theme}
        onChange={(event) => onDirectConfigChange('theme', event.target.value as Theme)}
        className="form-control form-select color-border-primary color-bg-primary appearance-none bg-no-repeat rounded-md border px-[12px] py-[5px] pr-6"
      >
        {availableThemes.map((value) => (
          <option key={value} value={value}>
            {t(`theme=${value}`)}
          </option>
        ))}
      </select>

      {directConfig.theme === 'custom' ? (
        <fieldset className="mt-4">
          <label htmlFor="themeUrl" className="block font-semibold">
            {t('URLToThemeCSS')}
          </label>
          <input
            id="themeUrl"
            value={directConfig.themeUrl}
            onChange={(event) => onDirectConfigChange('themeUrl', event.target.value as Theme)}
            type="text"
            className="form-control min-w-[75%] placeholder-gray-500 my-2 rounded-md border px-[12px] py-[5px] sm:min-w-[50%]"
            placeholder={`${env.app_host}/themes/custom_example.css`}
          />

          <p className="color-text-danger text-xs">{t('warningExternalCSSUnsafe')}</p>
        </fieldset>
      ) : null}

      <h3>{t('enableGiscus')}</h3>
      <p>
        <Trans i18nKey="config:addTheFollowingScriptTag" />
      </p>
      {!config.repositoryId || (!config.category && config.mapping !== 'number') ? (
        <div className="flash flash-warn mb-4">
          <Trans
            i18nKey="config:youHaveNotConfiguredRepositoryCategory"
            components={{ arepo: <a href="#repository" />, acategory: <a href="#category" /> }}
          />
        </div>
      ) : null}
      <div dir="ltr" className="highlight highlight-text-html-basic relative">
        <pre>
          <span className="pl-kos">{'<'}</span>
          <span className="pl-ent">script</span> <span className="pl-c1">src</span>={'"'}
          <span className="pl-s">{env.app_host}/client.js</span>
          {'"\n        '}
          <span className="pl-c1">data-repo</span>={'"'}
          <span className="pl-s">{dRepository || t('[enterRepoHere]')}</span>
          {'"\n        '}
          <span className="pl-c1">data-repo-id</span>={'"'}
          <span className="pl-s">{config.repositoryId || t('[enterRepoIDHere]')}</span>
          {'"\n        '}
          {config.mapping !== 'number' ? (
            <>
              {config.useCategory ? (
                <>
                  <span className="pl-c1">data-category</span>={'"'}
                  <span className="pl-s">{config.category || t('[enterCategoryHere]')}</span>
                  {'"\n        '}
                </>
              ) : null}
              <span className="pl-c1">data-category-id</span>={'"'}
              <span className="pl-s">{config.categoryId || t('[enterCategoryIDHere]')}</span>
              {'"\n        '}
            </>
          ) : null}
          <span className="pl-c1">data-mapping</span>={'"'}
          <span className="pl-s">{config.mapping}</span>
          {'"\n        '}
          {config.basePath !== '' ? (
            <>
              <span className="pl-c1">data-base-path</span>={'"'}
              <span className="pl-s">{config.basePath || ''}</span>
              {'"\n        '}
            </>
          ) : null}
          {['specific', 'number'].includes(config.mapping) ? (
            <>
              <span className="pl-c1">data-term</span>={'"'}
              <span className="pl-s">
                {config.term ||
                  (config.mapping === 'number' ? t('[enterNumberHere]') : t('[enterTermHere]'))}
              </span>
              {'"\n        '}
            </>
          ) : null}
          {config.mapping !== 'number' ? (
            <>
              <span className="pl-c1">data-strict</span>={'"'}
              <span className="pl-s">{Number(config.strict)}</span>
              {'"\n        '}
            </>
          ) : null}
          <span className="pl-c1">data-reactions-enabled</span>={'"'}
          <span className="pl-s">{Number(directConfig.reactionsEnabled)}</span>
          {'"\n        '}
          <span className="pl-c1">data-emit-metadata</span>={'"'}
          <span className="pl-s">{Number(directConfig.emitMetadata)}</span>
          {'"\n        '}
          <span className="pl-c1">data-input-position</span>={'"'}
          <span className="pl-s">{directConfig.inputPosition}</span>
          {'"\n        '}
          <span className="pl-c1">data-theme</span>={'"'}
          <span className="pl-s">
            {directConfig.theme === 'custom'
              ? directConfig.themeUrl || t('[enterThemeCSSURLHere]')
              : directConfig.theme}
          </span>
          {'"\n        '}
          <span className="pl-c1">data-lang</span>={'"'}
          <span className="pl-s">{directConfig.lang}</span>
          {'"\n        '}
          {config.lazyLoad ? (
            <>
              <span className="pl-c1">data-loading</span>={'"'}
              <span className="pl-s">lazy</span>
              {'"\n        '}
            </>
          ) : null}
          <span className="pl-c1">crossorigin</span>={'"'}
          <span className="pl-s">anonymous</span>
          {'"\n        '}
          <span className="pl-c1">async</span>
          <span className="pl-kos">{'>'}</span>
          {'\n'}
          <span className="pl-kos">{'<'}/</span>
          <span className="pl-ent">script</span>
          <span className="pl-kos">{'>'}</span>
        </pre>
        <ClipboardCopy />
      </div>
      <p>
        <Trans i18nKey="config:youCanCustomizeTheLayout" />
      </p>
    </div>
  );
}
