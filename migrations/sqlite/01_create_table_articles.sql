CREATE TABLE articles (
    doi TEXT NOT NULL PRIMARY KEY,
    xml TEXT NOT NULL,
    html TEXT NOT NULL,
    document TEXT NOT NULL,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    authors TEXT NOT NULL,
    abstract TEXT NOT NULL,
    licenses TEXT NOT NULL,
    content TEXT NOT NULL,
    headings TEXT NOT NULL
);
