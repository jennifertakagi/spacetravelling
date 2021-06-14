import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { format } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import { FiCalendar, FiUser } from 'react-icons/fi';

import Prismic from '@prismicio/client';

import { useState } from 'react';
import { getPrismicClient } from '../services/prismic';

import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const { next_page = '', results = [] } = postsPagination;
  const [posts, setPosts] = useState(results);

  const loadMorePosts = async (): Promise<void> => {
    await fetch(next_page)
      .then(response => response.json())
      .then(res => {
        const newPostsArray = [...posts, res.results].flat();
        setPosts(newPostsArray);
      });
  };

  return (
    <>
      <Head>
        <title>Home | SpaceTravelling</title>
      </Head>

      <main className={styles.contentContainer}>
        <div className={styles.posts}>
          {posts.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div className={styles.postDetails}>
                  <div>
                    <FiCalendar size={20} color="#D7D7D7" />
                    <time>
                      {format(
                        new Date(post.first_publication_date),
                        'MMM dd yyyy',
                        {
                          locale: enUS,
                        }
                      )}
                    </time>
                  </div>
                  <div>
                    <FiUser size={20} color="#D7D7D7" />
                    <p>{post.data.author}</p>
                  </div>
                </div>
              </a>
            </Link>
          ))}
        </div>
        {next_page && (
          <button type="button" onClick={loadMorePosts}>
            Load more posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const { next_page, results = [] } = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['publication.title', 'publication.content'],
      pageSize: 2,
    }
  );

  const posts = results.map(post => ({
    uid: post.uid,
    first_publication_date: post.first_publication_date,
    data: {
      title: post?.data?.title,
      subtitle: post?.data?.subtitle,
      author: post?.data?.author,
    },
  }));

  return {
    props: {
      postsPagination: {
        next_page,
        results: posts,
      },
    },
  };
};
