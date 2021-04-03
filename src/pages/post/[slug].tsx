import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import Head from 'next/head';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import { getPrismicClient } from '../../services/prismic';

import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
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
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  // TODO
  const { isFallback } = useRouter();

  if (isFallback) {
    return 'Carregando...';
  }

  const date = new Date(post.first_publication_date);
  const time = format(date, "PP'", {
    locale: ptBR,
  });

  const contentWords = post.data.content.reduce((acc, element) => {
    const text = RichText.asText(element.body);
    const words = text.split(' ');
    acc += Number(words.length);
    return acc;
  }, 0);

  const readingTime = Math.ceil(contentWords / 200);

  return (
    <>
      <Head>
        <title>Post | spacetraveling </title>
      </Head>

      <Header />

      <div className={styles.containerBanner}>
        <img src={post.data.banner.url} alt="" />
      </div>

      <main className={commonStyles.container}>
        <article className={commonStyles.content}>
          <div className={styles.headerContent}>
            <strong>{post.data.title}</strong>
            <div className={styles.infosContent}>
              <time>
                <FiCalendar />
                {time}
              </time>
              <span>
                <FiUser />
                {post.data.author}
              </span>

              <span>
                <FiClock /> {readingTime} min
              </span>
            </div>
            {post.data.content.map(content => (
              <div key={content.heading}>
                <h2>{content.heading}</h2>
                <p
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(content.body),
                  }}
                />
              </div>
            ))}
          </div>
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title'],
    }
  );

  const postsUID = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  // TODO
  return {
    paths: postsUID,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  // TODO
  return {
    props: {
      post: response,
    },
  };
};
