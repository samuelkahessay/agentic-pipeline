namespace PRDtoProd.DTOs;

public record CreateKnowledgeRequest(string Title, string Content, string Tags, string Category);

public record KnowledgeResponse(
    Guid Id,
    string Title,
    string Content,
    string Tags,
    string Category
);

public record ArticleMatch(Guid ArticleId, string Title, double Score);
