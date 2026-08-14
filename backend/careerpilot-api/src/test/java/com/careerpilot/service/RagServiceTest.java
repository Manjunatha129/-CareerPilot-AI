package com.careerpilot.service;

import com.careerpilot.dto.RagResponseDTO;
import com.careerpilot.entity.DocumentChunk;
import com.careerpilot.repository.DocumentChunkRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class RagServiceTest {

    @Mock
    private DocumentChunkRepository documentChunkRepository;

    @Mock
    private AiServiceClient aiServiceClient;

    @InjectMocks
    private RagService ragService;

    @Spy
    private DocumentIngestionService ingestionService = new DocumentIngestionService(null, null, null);

    private DocumentChunk testChunk;

    @BeforeEach
    public void setUp() {
        testChunk = DocumentChunk.builder()
                .id(1L)
                .documentName("Java Spring Guide")
                .sourceType("INTERVIEW_GUIDE")
                .chunkIndex(0)
                .content("Dependency Injection (DI) manages object creation and lifecycles via @Autowired or constructor injection.")
                .build();
    }

    @Test
    @DisplayName("Should retrieve relevant chunk and generate grounded RAG answer with source citation")
    public void shouldRetrieveChunkAndGenerateGroundedAnswer() {
        when(documentChunkRepository.findAll()).thenReturn(List.of(testChunk));
        when(aiServiceClient.generateGroundedRagAnswer(any())).thenReturn("{\"answer\":\"Dependency Injection allows inversion of control.\", \"hasSufficientContext\":true}");

        RagResponseDTO response = ragService.queryKnowledgeBase("What is dependency injection?", 4);

        assertThat(response).isNotNull();
        assertThat(response.isHasSufficientContext()).isTrue();
        assertThat(response.getSources()).hasSize(1);
        assertThat(response.getSources().get(0).getDocumentTitle()).isEqualTo("Java Spring Guide");
    }

    @Test
    @DisplayName("Anti-Hallucination Test: Should return clear notice when query has zero relevant knowledge context")
    public void shouldReturnAntiHallucinationNoticeForUnsupportedQuery() {
        when(documentChunkRepository.findAll()).thenReturn(List.of(testChunk));

        RagResponseDTO response = ragService.queryKnowledgeBase("What is the stock price of Apple?", 4);

        assertThat(response).isNotNull();
        assertThat(response.isHasSufficientContext()).isFalse();
        assertThat(response.getAnswer()).contains("don't have enough relevant information");
        assertThat(response.getSources()).isEmpty();
    }

    @Test
    @DisplayName("Should split long text into recursive chunks while preserving section bounds")
    public void shouldSplitTextIntoChunks() {
        String markdown = "# Title\n\n## Section 1\nSome paragraph text here.\n\n## Section 2\nAnother paragraph text here.";
        List<String> chunks = ingestionService.splitIntoChunks(markdown, 100, 20);

        assertThat(chunks).isNotEmpty();
        assertThat(chunks).anyMatch(c -> c.contains("Section 1"));
    }
}
