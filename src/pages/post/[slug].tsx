import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { format } from 'date-fns';
import enUS from 'date-fns/locale/en-US';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import { getPrismicClient } from '../../services/prismic';
import Comment from '../../components/Comment';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string;
  last_publication_date: string;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
  prevSlug: string;
  prevTitle: string;
  nextSlug: string;
  nextTitle: string;
}

interface PostProps {
  post: Post;
  preview: boolean;
}

export default function Post({ post, preview }: PostProps): JSX.Element {
  const router = useRouter();

  const readingTime = Math.ceil(
    post?.data?.content.reduce((total, contentItem) => {
      const heading = String(contentItem.heading).split(' ');
      const body = RichText.asText(contentItem.body).split(' ');
      return total + (body.length + heading.length);
    }, 0) / 200
  );

  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>{post.data.title} | IgNews</title>
      </Head>

      <main className={styles.container}>
        <article className={styles.post}>
          <h1>{post.data.title}</h1>
          <div className={styles.postDetails}>
            <div>
              <FiCalendar size={20} color="#D7D7D7" />
              <time>
                {format(new Date(post?.first_publication_date), 'MMM dd yyyy', {
                  locale: enUS,
                })}
              </time>
            </div>

            <div>
              <FiUser size={20} color="#D7D7D7" />
              <p>{post.data.author}</p>
            </div>

            <div>
              <FiClock size={20} color="#D7D7D7" />
              <p>{`${readingTime} min`}</p>
            </div>
          </div>

          <span>
            * edited in{' '}
            {format(
              new Date(post?.last_publication_date),
              "MMM dd yyyy, 'at' HH:mm",
              {
                locale: enUS,
              }
            )}
          </span>

          {post.data.content.map(content => (
            <section>
              <h2>{content.heading}</h2>
              {content.body.map(body => (
                <p>{body.text}</p>
              ))}
            </section>
          ))}

          <nav className={styles.navContainer}>
            <div>
              <p>{post.prevTitle}</p>

              {post?.prevSlug && (
                <Link href={`/post/${post.prevSlug}`}>
                  <a>
                    <button type="button" className={styles.nextPage}>
                      Previous post
                    </button>
                  </a>
                </Link>
              )}
            </div>

            <div>
              <p>{post.nextTitle}</p>

              {post?.nextSlug && (
                <Link href={`/post/${post.nextSlug}`}>
                  <a>
                    <button type="button" className={styles.nextPage}>
                      Next post
                    </button>
                  </a>
                </Link>
              )}
            </div>
          </nav>

          <Comment />

          {preview && (
            <aside>
              <Link href="/api/exit-preview">
                <a>Exit of Preview Mode</a>
              </Link>
            </aside>
          )}
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.title,post.subtitle,post.author'],
      pageSize: 6,
    }
  );
  const paths = posts.results.map(post => ({
    params: {
      slug: post.uid,
    },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {
    ref: previewData?.ref ?? null,
  });

  const prevPost = (
    await prismic.query(Prismic.predicates.at('document.type', 'post'), {
      fetch: ['post.title'],
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
    })
  )?.results[0];

  const nextPost = (
    await prismic.query(Prismic.predicates.at('document.type', 'post'), {
      fetch: ['post.title'],
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date desc]',
    })
  )?.results[0];

  const post = {
    first_publication_date: response?.first_publication_date,
    last_publication_date: response?.last_publication_date,
    uid: response.uid,
    data: {
      title: response?.data?.title,
      subtitle: response?.data?.subtitle,
      banner: {
        url: response?.data?.banner?.url,
      },
      author: response?.data?.author,
      content: response.data.content.map(c => ({
        heading: c.heading,
        body: [...c.body],
      })),
    },
    prevSlug: prevPost?.uid ?? null,
    prevTitle: prevPost?.data?.title ?? null,
    nextSlug: nextPost?.uid ?? null,
    nextTitle: nextPost?.data?.title ?? null,
  };

  return {
    props: {
      post,
      preview,
    },
    revalidate: 60 * 30, // 30 minutes
  };
};
