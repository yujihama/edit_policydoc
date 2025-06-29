import { Database } from '../models/Database.js';
import { DocumentService } from '../services/DocumentService.js';
import { EmbeddingService } from '../services/EmbeddingService.js';

async function initializeDatabase() {
  console.log('Initializing database...');
  
  const database = new Database();
  await database.initialize();
  
  const embeddingService = new EmbeddingService(database);
  const documentService = new DocumentService(database, embeddingService);

  // サンプル文書の作成
  const sampleDocument = {
    title: '自動車保険約款（サンプル）',
    content: {
      sections: [
        {
          id: 'article-1',
          type: 'article' as const,
          number: '1',
          title: '用語の定義',
          content: 'この約款において、次の用語の意味は、それぞれ次の定義によります。\n(1) 自動車：道路運送車両法第2条第2項に定める自動車をいいます。\n(2) 被保険者：保険契約により補償を受けることができる方をいいます。\n(3) 保険事故：この約款に定める保険金の支払事由となる事故をいいます。',
          order: 0,
        },
        {
          id: 'article-2',
          type: 'article' as const,
          number: '2',
          title: '保険金を支払う場合',
          content: '当会社は、被保険者が自動車の運行によって他人の生命または身体を害することにより、被保険者が法律上の損害賠償責任を負担することによって被る損害に対して、この約款に従い保険金を支払います。',
          order: 1,
        },
        {
          id: 'article-3',
          type: 'article' as const,
          number: '3',
          title: '保険金を支払わない場合',
          content: '当会社は、次のいずれかに該当する事由によって生じた損害に対しては、保険金を支払いません。\n(1) 保険契約者、被保険者またはこれらの者の法定代理人の故意によって生じた損害\n(2) 戦争、外国の武力行使、革命、政権奪取、内乱、武装反乱その他これらに類似の事変または暴動によって生じた損害\n(3) 地震もしくは噴火またはこれらによる津波によって生じた損害',
          order: 2,
        },
        {
          id: 'article-4',
          type: 'article' as const,
          number: '4',
          title: '保険期間',
          content: '保険期間は、保険証券に記載された保険期間の初日の午後4時（保険証券にこれと異なる時刻が記載されている場合はその時刻）に始まり、末日の午後4時に終わります。',
          order: 3,
        },
      ],
      format: 'structured' as const,
    },
    metadata: {
      category: '自動車保険',
      version: '1.0',
      tags: ['自動車', '責任保険', '対人'],
      language: 'ja' as const,
      wordCount: 300,
    },
  };

  try {
    const document = await documentService.createDocument(sampleDocument);
    console.log('Sample document created:', document.id);

    // 埋め込みベクトルの生成
    await embeddingService.indexDocument(document);
    console.log('Document indexed for similarity search');

    // 追加のサンプル文書
    const sampleDocument2 = {
      title: '火災保険約款（サンプル）',
      content: {
        sections: [
          {
            id: 'article-1',
            type: 'article' as const,
            number: '1',
            title: '用語の定義',
            content: 'この約款において、次の用語の意味は、それぞれ次の定義によります。\n(1) 建物：土地に定着し、屋根および柱または壁を有するものをいいます。\n(2) 被保険者：保険契約により補償を受けることができる方をいいます。\n(3) 損害：火災、落雷、破裂または爆発によって保険の対象について生じた損害をいいます。',
            order: 0,
          },
          {
            id: 'article-2',
            type: 'article' as const,
            number: '2',
            title: '保険金を支払う場合',
            content: '当会社は、火災、落雷、破裂または爆発によって保険の対象について生じた損害に対して、この約款に従い保険金を支払います。',
            order: 1,
          },
        ],
        format: 'structured' as const,
      },
      metadata: {
        category: '火災保険',
        version: '1.0',
        tags: ['火災', '建物', '家財'],
        language: 'ja' as const,
        wordCount: 150,
      },
    };

    const document2 = await documentService.createDocument(sampleDocument2);
    console.log('Sample document 2 created:', document2.id);
    await embeddingService.indexDocument(document2);

    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Database initialization failed:', error);
  } finally {
    database.close();
  }
}

// スクリプトとして実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase();
}

export { initializeDatabase };

