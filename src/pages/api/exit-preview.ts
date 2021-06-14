export default async (_, res): Promise<void> => {
  res.clearPreviewData();

  res.writeHead(307, { Location: '/' });
  res.end();
};
