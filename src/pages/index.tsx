import { useEffect, useState } from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import { FiCalendar, FiUser } from 'react-icons/fi';

import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Link from 'next/link';
import Header from '../components/Header';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
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

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState([]);
  const [nextPage, setNexPage] = useState(postsPagination.next_page);

  function formattingPost(post: Post) {
    const date = new Date(post.first_publication_date);
    return {
      uid: post.uid,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
      first_publication_date: format(date, "PP'", {
        locale: ptBR,
      }),
    };
  }

  useEffect(() => {
    const formatedPosts = postsPagination.results.map(post => {
      return formattingPost(post);
    });

    setPosts(formatedPosts);
  }, []);

  /*
  const formatedPosts = postsPagination.results.map(post => {
    return formattingPost(post);
  }); */

  async function getPosts() {
    const data = await fetch(nextPage).then(response => response.json());

    const formatedPosts = data.results.map(post => {
      return formattingPost(post);
    });

    const concatPosts = posts.concat(formatedPosts);

    setPosts(concatPosts);

    setNexPage(data.next_page);
  }

  return (
    <>
      <Head>
        <title>Home | spacetraveling </title>
      </Head>

      <Header />

      <main className={commonStyles.container}>
        <article className={commonStyles.content}>
          <div id="posts" className={styles.contentHome}>
            {posts.map(result => (
              <Link href={`/post/${result.uid}`} key={result.uid}>
                <a>
                  <strong>{result.data.title}</strong>
                  <p>{result.data.subtitle}</p>
                  <div className={styles.footerContent}>
                    <time>
                      <FiCalendar />
                      {result.first_publication_date}
                    </time>
                    <span>
                      <FiUser />
                      {result.data.author}
                    </span>
                  </div>
                </a>
              </Link>
            ))}
          </div>
          <div id="buttonNextPaga">
            {nextPage && (
              <button
                type="button"
                className={styles.buttonMorePost}
                onClick={getPosts}
              >
                Carregar mais posts
              </button>
            )}
          </div>
        </article>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.author', 'posts.subtitle'],
      pageSize: 1,
    }
  );
  return {
    props: {
      postsPagination: postsResponse,
    },
  };
};
