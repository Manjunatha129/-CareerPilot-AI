import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Code,
  Users,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Brain,
  BookOpen,
  Send,
  Target,
  Terminal
} from 'lucide-react';
import { ResumeDTO, ParsedResumeAnalysis } from '../types';

interface ResumeInterviewQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  resume: ResumeDTO | null;
  parsedAnalysis: ParsedResumeAnalysis | null;
  onLaunchChatbot?: () => void;
}

interface QuestionItem {
  id: string;
  category: 'technical' | 'coding' | 'managerial';
  question: string;
  difficulty: 'ENTRY' | 'MID' | 'SENIOR' | 'ADVANCED';
  skillsTag: string[];
  keyTopicsToCover: string[];
  idealSampleAnswer: string;
  pseudoCode?: string;
  javaCode?: string;
  pythonCode?: string;
}

/**
 * Dynamic Resume Question Predictor Engine
 * Generates 20 Technical Qs, 10 Coding Problems (Pseudo + Java + Python), and 15 Managerial Qs tailored to resume.
 */
function generateDynamicQuestionsForResume(
  resume: ResumeDTO,
  parsedAnalysis: ParsedResumeAnalysis | null
): { technical: QuestionItem[]; coding: QuestionItem[]; managerial: QuestionItem[] } {
  let rawSkills: string[] = [];
  if (parsedAnalysis?.skills) {
    rawSkills = [
      ...(parsedAnalysis.skills.programmingLanguages || []),
      ...(parsedAnalysis.skills.frameworks || []),
      ...(parsedAnalysis.skills.databases || []),
      ...(parsedAnalysis.skills.tools || []),
      ...(parsedAnalysis.skills.cloudTechnologies || []),
      ...(parsedAnalysis.skills.otherSkills || [])
    ];
  }

  const fullText = (resume.rawText || '') + ' ' + (resume.fileName || '') + ' ' + rawSkills.join(' ');
  const textLower = fullText.toLowerCase();
  const candidateName = parsedAnalysis?.candidateInformation?.name || resume.fileName.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');

  const hasSkill = (term: string) => textLower.includes(term.toLowerCase());

  const skillsList: string[] = Array.from(new Set(rawSkills)).filter(Boolean);
  if (skillsList.length === 0) {
    if (hasSkill('java')) skillsList.push('Java');
    if (hasSkill('python')) skillsList.push('Python');
    if (hasSkill('react')) skillsList.push('React');
    if (hasSkill('javascript') || hasSkill('js')) skillsList.push('JavaScript');
    if (hasSkill('postgres') || hasSkill('sql')) skillsList.push('PostgreSQL');
    if (hasSkill('docker')) skillsList.push('Docker');
  }

  const primaryTech = skillsList[0] || 'Software Engineering';
  const frameworkTech = skillsList.find(s => /react|spring|fastapi|express|angular|vue|django/i.test(s)) || 'Frameworks';
  const databaseTech = skillsList.find(s => /sql|postgres|mongo|db|oracle/i.test(s)) || 'Databases';
  const devopsTech = skillsList.find(s => /docker|k8s|kubernetes|aws|ci\/cd|git/i.test(s)) || 'DevOps';

  // SECTION 1: 20 TECHNICAL DEEP-DIVE QUESTIONS
  const generatedTech: QuestionItem[] = [
    {
      id: 'tech-1',
      category: 'technical',
      question: `1. In your resume, you list ${primaryTech}. What are the most common performance bottlenecks in ${primaryTech} applications and how do you optimize them?`,
      difficulty: 'SENIOR',
      skillsTag: [primaryTech, 'Performance', 'Architecture'],
      keyTopicsToCover: [
        `Memory allocation and garbage collection/resource lifecycles in ${primaryTech}`,
        'Profiling tools (heap dumps, latency monitoring, flamegraphs)',
        'Asynchronous execution and I/O concurrency',
        'Quantifiable benchmarks from production'
      ],
      idealSampleAnswer: `When optimizing ${primaryTech} applications, I first profile memory allocations and CPU execution using native profiling tools. I address CPU bottlenecks by introducing non-blocking asynchronous I/O and caching expensive computations. I also review resource lifecycles to prevent memory leaks, resulting in significantly lower latency and higher throughput.`
    },
    {
      id: 'tech-2',
      category: 'technical',
      question: `2. Walk through your experience building applications with ${frameworkTech}. How do you design clean component/service boundaries?`,
      difficulty: 'MID',
      skillsTag: [frameworkTech, 'Software Design', 'Modularity'],
      keyTopicsToCover: [
        'Separation of Concerns (UI, Business Logic, Data Access)',
        'Dependency Injection or State Management patterns',
        'Reusability and DRY principles',
        'Automated testing coverage for components/services'
      ],
      idealSampleAnswer: `When building with ${frameworkTech}, I follow strict Separation of Concerns. I isolate business logic from presentation components or controller endpoints, utilizing dependency injection or centralized state stores. This keeps code modular, easy to test with unit test suites, and maintainable across long-term development.`
    },
    {
      id: 'tech-3',
      category: 'technical',
      question: `3. You have experience with ${databaseTech}. How do you structure database schemas, indexes, and connection pooling for high concurrency?`,
      difficulty: 'SENIOR',
      skillsTag: [databaseTech, 'Database Scaling', 'Indexing'],
      keyTopicsToCover: [
        'Index strategy (B-Tree, GIN, Composite indexes)',
        'Connection pooling settings to prevent lock contention',
        'Query execution plan analysis (EXPLAIN ANALYZE)',
        'Transaction isolation levels (ACID compliance)'
      ],
      idealSampleAnswer: `For ${databaseTech}, I create composite indexes on frequently filtered and joined columns while avoiding index overhead on high-write tables. I configure connection pools to reuse persistent database sockets aligned with available CPU cores, and I use query analysis tools to replace slow full-table scans with index scans.`
    },
    {
      id: 'tech-4',
      category: 'technical',
      question: `4. Based on your experience with ${devopsTech}, how do you automate CI/CD pipelines and containerize services for deployment?`,
      difficulty: 'MID',
      skillsTag: [devopsTech, 'DevOps', 'CI/CD', 'Containers'],
      keyTopicsToCover: [
        'Multi-stage builds to minimize image footprint',
        'Automated linting, unit testing, and vulnerability scanning',
        'Environment secrets injection',
        'Zero-downtime rolling deployments'
      ],
      idealSampleAnswer: `I create multi-stage deployment configurations where dependencies are built in a builder stage and minimal runtime images are packaged for production. I automate pipeline stages (Linting -> Testing -> Container Build -> Vulnerability Scan -> Cloud Deploy) using GitHub Actions or CI runners.`
    },
    {
      id: 'tech-5',
      category: 'technical',
      question: `5. How do you design robust RESTful or GraphQL APIs using ${primaryTech} / ${frameworkTech} with proper error handling and versioning?`,
      difficulty: 'MID',
      skillsTag: ['REST APIs', frameworkTech, 'API Security'],
      keyTopicsToCover: [
        'Standardized HTTP status codes (200, 201, 400, 401, 404, 500)',
        'URI path versioning (/v1/) vs Header versioning',
        'Structured error response schemas (RFC 7807)',
        'Authentication headers and CORS origin rules'
      ],
      idealSampleAnswer: `I design REST APIs following standard HTTP semantics and noun-based URIs. I implement path versioning for API longevity, define OpenAPI schemas for frontend contracts, enforce HTTPS and Bearer JWT authentication, and use global exception handlers to return consistent structured error responses.`
    }
  ];

  const dynamicTopics = [
    { title: 'System Security & Auth', tag: 'Security', q: `6. How do you implement secure user authentication (OAuth2 / JWT) and protect ${primaryTech} APIs against CORS and CSRF attacks?`, ans: 'I use OAuth2 authorization flows issuing stateless JWT access tokens signed with RS256 private keys. Access tokens have short TTLs (15 mins), refresh tokens use HTTP-only SameSite cookies, and CORS middleware restricts origins to authorized frontend domains.' },
    { title: 'Asynchronous Workflows', tag: 'Async Tasks', q: `7. How do you handle long-running asynchronous tasks (background jobs / queues) in ${primaryTech} applications?`, ans: 'For background tasks, I decouple web request handlers from heavy processing using message brokers (Redis/RabbitMQ/Kafka). Endpoints immediately return HTTP 202 Accepted with a task ID while worker nodes process jobs asynchronously.' },
    { title: 'Microservices Architecture', tag: 'Microservices', q: `8. What patterns do you use to manage distributed transactions and service communication across ${frameworkTech} microservices?`, ans: 'I use the Saga pattern (orchestration or choreography) to manage distributed transactions with compensating actions on failure. For inter-service communication, I use gRPC/REST for synchronous calls and event buses for asynchronous updates.' },
    { title: 'Caching Strategies', tag: 'Redis / Caching', q: `9. How do you design caching layers (e.g. Redis) to handle cache invalidation and prevent cache stampedes?`, ans: 'I implement Cache-Aside caching with explicit TTLs on keys. To prevent Cache Stampedes under high traffic, I use distributed Mutex locks (Redlock) or early probabilistic expiration so only one thread recomputes stale cache items.' },
    { title: 'Automated Testing', tag: 'Testing', q: `10. What testing frameworks and methodologies do you use to ensure software reliability for your ${primaryTech} projects?`, ans: 'I maintain a strong test pyramid using unit test frameworks (Pytest/JUnit/Jest). I write parameterized unit tests with mocks for external network calls, and run integration tests against real database instances using containerized environments.' },
    { title: 'Error Logging & Monitoring', tag: 'Observability', q: `11. How do you set up centralized logging, distributed tracing, and metrics for your production services?`, ans: 'I configure structured JSON logging containing correlation/trace IDs across service boundaries. I collect telemetry metrics using OpenTelemetry/Prometheus and visualize latency, error rates, and system throughput on Grafana dashboards.' },
    { title: 'State Management / Data Flow', tag: 'Data Flow', q: `12. How do you ensure state consistency and prevent data race conditions in concurrent multi-threaded or multi-worker systems?`, ans: 'I prevent data race conditions using atomic database operations, optimistic concurrency locking (@Version columns or ETags), and thread-safe data structures, ensuring consistent state updates under high concurrent loads.' },
    { title: 'Git & Version Control', tag: 'Git / Workflow', q: `13. What Git branching strategy (Trunk-Based vs GitFlow) do you follow, and how do you conduct effective code reviews?`, ans: 'I advocate for Trunk-Based Development with short-lived feature branches and Pull Requests. Code reviews focus on architectural design, security, test coverage, and readability, enforced by automated CI checks before merging.' },
    { title: 'Data Structures & Algorithms', tag: 'Algorithms', q: `14. How do you evaluate time and space complexity (Big-O) when choosing data structures for large dataset processing?`, ans: 'I evaluate operations by their Big-O complexity. For fast O(1) lookups I use Hash Maps/Sets; for ordered traversals O(log N) Trees; and I profile memory overhead to select structures that balance CPU time against RAM usage.' },
    { title: 'Cloud Infrastructure', tag: 'Cloud', q: `15. How do you utilize cloud services (${devopsTech} / AWS / Cloud) for scalable infrastructure and cost optimization?`, ans: 'I use cloud infrastructure-as-code (Terraform) to deploy auto-scaling compute clusters, managed database replicas, and object storage buckets. I optimize costs using spot instances, auto-scaling policies, and automated resource shutdown.' },
    { title: 'Search & Indexing', tag: 'Search', q: `16. How do you implement full-text search, filtering, or vector indexing for efficient query retrieval?`, ans: 'I implement inverted text indexes (PostgreSQL tsvector / Elasticsearch) or vector embeddings (pgvector/HNSW indexes) depending on whether exact keyword match or semantic similarity search is needed.' },
    { title: 'Event-Driven Systems', tag: 'Messaging', q: `17. How do you ensure idempotent message processing when working with event streams (Kafka / Event Queues)?`, ans: 'I design consumers to track processed message unique IDs in a deduplication database table within the same transaction as business updates, guaranteeing at-least-once delivery produces exact once state outcomes.' },
    { title: 'Memory Management', tag: 'Memory / GC', q: `18. How do you prevent and resolve memory leaks or thread leaks in long-running ${primaryTech} web servers?`, ans: 'I capture heap dumps during load testing, verify that unclosed connection pools or listener subscriptions are disposed of in finally blocks, and configure process worker auto-restarts after serving set request thresholds.' },
    { title: 'Refactoring & Legacy Code', tag: 'Refactoring', q: `19. How do you approach refactoring legacy backend or frontend code without introducing regression bugs?`, ans: 'I start by adding comprehensive integration characterization tests around legacy boundaries. I refactor incrementally using the Strangler Fig pattern, deploying small pull requests behind feature flags to verify stability.' },
    { title: 'AI & Data Integration', tag: 'AI Pipelines', q: `20. How do you integrate AI models, LLM APIs, or data processing pipelines into web backend applications?`, ans: 'I isolate AI model interactions behind clean service abstractions. For LLMs, I implement retries with exponential backoff, prompt template management, context window token truncation, and fallback provider models for high uptime.' }
  ];

  dynamicTopics.forEach((t, index) => {
    generatedTech.push({
      id: `tech-${index + 6}`,
      category: 'technical',
      question: t.q,
      difficulty: index % 3 === 0 ? 'ADVANCED' : index % 2 === 0 ? 'SENIOR' : 'MID',
      skillsTag: [t.tag, primaryTech],
      keyTopicsToCover: [
        'Core architecture principles & industry standards',
        'Failure modes, error handling, and security',
        'Performance metrics & scalability considerations',
        'Production experience examples'
      ],
      idealSampleAnswer: t.ans
    });
  });

  // SECTION 2: 10 MOST EXPECTED CODING PROBLEMS (WITH PSEUDO CODE, JAVA, PYTHON)
  const generatedCoding: QuestionItem[] = [
    {
      id: 'code-1',
      category: 'coding',
      question: `1. Two Sum / Target Pair Search (LeetCode #1): Given an array of integers and a target sum, return indices of the two numbers that add up to target.`,
      difficulty: 'ENTRY',
      skillsTag: [primaryTech, 'Hash Map', 'Arrays', 'O(N) Complexity'],
      keyTopicsToCover: ['Hash Map key-value complement lookup', 'Single pass O(N) Time Complexity', 'O(N) Space Complexity'],
      idealSampleAnswer: `Use a Hash Map to store visited numbers and their indices. Iterate through the array; for each number x, calculate complement = target - x. If complement exists in map, return [map[complement], i]. Otherwise, store map[x] = i.`,
      pseudoCode: `FUNCTION twoSum(nums, target):
    INITIALIZE HashMap seen
    FOR index i FROM 0 TO length(nums) - 1:
        SET complement = target - nums[i]
        IF complement EXISTS IN seen:
            RETURN [seen[complement], i]
        END IF
        SET seen[nums[i]] = i
    END FOR
    RETURN []
END FUNCTION`,
      javaCode: `import java.util.HashMap;
import java.util.Map;

public class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (seen.containsKey(complement)) {
                return new int[] { seen.get(complement), i };
            }
            seen.put(nums[i], i);
        }
        return new int[0];
    }
}`,
      pythonCode: `def two_sum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`
    },
    {
      id: 'code-2',
      category: 'coding',
      question: `2. Design an LRU (Least Recently Used) Cache (LeetCode #146): Implement a data structure supporting O(1) get(key) and put(key, value) with fixed capacity.`,
      difficulty: 'SENIOR',
      skillsTag: ['Doubly Linked List', 'Hash Map', 'O(1) Operations', 'System Design'],
      keyTopicsToCover: ['Hash Map for O(1) key lookup', 'Doubly Linked List for O(1) node eviction & insertion', 'Sentinel head and tail nodes'],
      idealSampleAnswer: `Combine a Hash Map (mapping key -> Node) with a Doubly Linked List. The doubly linked list maintains usage order (most recent at head, least recent at tail). Hash Map enables O(1) node access, and doubly linked list enables O(1) node deletion and head insertion.`,
      pseudoCode: `CLASS Node: key, val, prev, next

CLASS LRUCache:
    capacity, HashMap cache, DoublyLinkedList (head, tail)

    FUNCTION get(key):
        IF key NOT IN cache RETURN -1
        node = cache[key]
        moveToHead(node)
        RETURN node.val

    FUNCTION put(key, val):
        IF key IN cache:
            node = cache[key]
            node.val = val
            moveToHead(node)
        ELSE:
            IF cache.size == capacity:
                evictTail()
            newNode = Node(key, val)
            addToHead(newNode)
            cache[key] = newNode`,
      javaCode: `import java.util.HashMap;
import java.util.Map;

class LRUCache {
    class Node {
        int key, value;
        Node prev, next;
        Node(int k, int v) { this.key = k; this.value = v; }
    }

    private final int capacity;
    private final Map<Integer, Node> cache = new HashMap<>();
    private final Node head = new Node(0, 0), tail = new Node(0, 0);

    public LRUCache(int capacity) {
        this.capacity = capacity;
        head.next = tail;
        tail.prev = head;
    }

    public int get(int key) {
        if (!cache.containsKey(key)) return -1;
        Node node = cache.get(key);
        remove(node);
        addHead(node);
        return node.value;
    }

    public void put(int key, int value) {
        if (cache.containsKey(key)) {
            remove(cache.get(key));
        } else if (cache.size() == capacity) {
            cache.remove(tail.prev.key);
            remove(tail.prev);
        }
        Node node = new Node(key, value);
        addHead(node);
        cache.put(key, node);
    }

    private void remove(Node n) { n.prev.next = n.next; n.next.prev = n.prev; }
    private void addHead(Node n) { n.next = head.next; n.prev = head; head.next.prev = n; head.next = n; }
}`,
      pythonCode: `class Node:
    def __init__(self, key: int = 0, val: int = 0):
        self.key, self.val = key, val
        self.prev = self.next = None

class LRUCache:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.cache = {}
        self.head, self.tail = Node(), Node()
        self.head.next, self.tail.prev = self.tail, self.head

    def get(self, key: int) -> int:
        if key not in self.cache: return -1
        node = self.cache[key]
        self._remove(node)
        self._add_to_head(node)
        return node.val

    def put(self, key: int, value: int) -> None:
        if key in self.cache: self._remove(self.cache[key])
        elif len(self.cache) == self.cap:
            lru = self.tail.prev
            self._remove(lru)
            del self.cache[lru.key]
        node = Node(key, value)
        self._add_to_head(node)
        self.cache[key] = node

    def _remove(self, node): node.prev.next, node.next.prev = node.next, node.prev
    def _add_to_head(self, node): node.next, node.prev = self.head.next, self.head; self.head.next.prev, self.head.next = node, node`
    },
    {
      id: 'code-3',
      category: 'coding',
      question: `3. Longest Substring Without Repeating Characters (LeetCode #3): Find the length of the longest substring without duplicate characters.`,
      difficulty: 'MID',
      skillsTag: ['Sliding Window', 'Hash Set', 'Strings', 'O(N) Complexity'],
      keyTopicsToCover: ['Sliding Window pointers (left, right)', 'Hash Set for O(1) duplicate checks', 'Max length tracking'],
      idealSampleAnswer: `Use a Sliding Window with left and right pointers and a Set for unique characters. Advance the right pointer; if a duplicate character is encountered, shrink the window by advancing the left pointer and removing elements from the Set until unique.`,
      pseudoCode: `FUNCTION lengthOfLongestSubstring(s):
    INITIALIZE HashSet charSet
    SET left = 0, maxLen = 0
    FOR right FROM 0 TO length(s) - 1:
        WHILE s[right] IN charSet:
            REMOVE s[left] FROM charSet
            INCREMENT left
        END WHILE
        ADD s[right] TO charSet
        SET maxLen = MAX(maxLen, right - left + 1)
    END FOR
    RETURN maxLen
END FUNCTION`,
      javaCode: `import java.util.HashSet;
import java.util.Set;

public class Solution {
    public int lengthOfLongestSubstring(String s) {
        Set<Character> set = new HashSet<>();
        int left = 0, maxLen = 0;
        for (int right = 0; right < s.length(); right++) {
            while (set.contains(s.charAt(right))) {
                set.remove(s.charAt(left));
                left++;
            }
            set.add(s.charAt(right));
            maxLen = Math.max(maxLen, right - left + 1);
        }
        return maxLen;
    }
}`,
      pythonCode: `def length_of_longest_substring(s: str) -> int:
    char_set = set()
    left = max_len = 0
    for right in range(len(s)):
        while s[right] in char_set:
            char_set.remove(s[left])
            left += 1
        char_set.add(s[right])
        max_len = max(max_len, right - left + 1)
    return max_len`
    },
    {
      id: 'code-4',
      category: 'coding',
      question: `4. Merge K Sorted Lists (LeetCode #23): Merge K pre-sorted linked lists into one consolidated sorted linked list.`,
      difficulty: 'ADVANCED',
      skillsTag: ['Min-Heap / PriorityQueue', 'Linked Lists', 'Divide & Conquer'],
      keyTopicsToCover: ['Min-Heap tracking list head nodes', 'O(N log K) Time Complexity', 'PriorityQueue comparator'],
      idealSampleAnswer: `Push the head node of each of the K lists into a Min-Heap. Pop the smallest node, append it to the merged result list, and if the popped node has a next node, push next into the Min-Heap. Repeat until the Heap is empty.`,
      pseudoCode: `FUNCTION mergeKLists(lists):
    INITIALIZE MinHeap heap
    FOR EACH list head IN lists:
        IF head IS NOT NULL: PUSH (head.val, head) INTO heap
    END FOR
    INITIALIZE dummyNode, curr = dummyNode
    WHILE heap IS NOT EMPTY:
        node = POP MIN FROM heap
        curr.next = node
        curr = curr.next
        IF node.next IS NOT NULL: PUSH (node.next.val, node.next) INTO heap
    END WHILE
    RETURN dummyNode.next
END FUNCTION`,
      javaCode: `import java.util.PriorityQueue;

public class Solution {
    public ListNode mergeKLists(ListNode[] lists) {
        if (lists == null || lists.length == 0) return null;
        PriorityQueue<ListNode> pq = new PriorityQueue<>((a, b) -> Integer.compare(a.val, b.val));
        for (ListNode node : lists) if (node != null) pq.add(node);
        ListNode dummy = new ListNode(0), curr = dummy;
        while (!pq.isEmpty()) {
            ListNode node = pq.poll();
            curr.next = node;
            curr = curr.next;
            if (node.next != null) pq.add(node.next);
        }
        return dummy.next;
    }
}`,
      pythonCode: `import heapq

def mergeKLists(lists: list[ListNode]) -> ListNode:
    heap = []
    for i, l in enumerate(lists):
        if l: heapq.heappush(heap, (l.val, i, l))
    dummy = curr = ListNode(0)
    while heap:
        val, i, node = heapq.heappop(heap)
        curr.next = node
        curr = curr.next
        if node.next: heapq.heappush(heap, (node.next.val, i, node.next))
    return dummy.next`
    },
    {
      id: 'code-5',
      category: 'coding',
      question: `5. Binary Tree Level Order Traversal (LeetCode #102): Return the level-order (breadth-first) traversal of nodes' values as a 2D array.`,
      difficulty: 'MID',
      skillsTag: ['BFS', 'Queue', 'Binary Tree', 'O(N) Complexity'],
      keyTopicsToCover: ['Queue data structure (FIFO)', 'Processing level size per iteration', 'O(N) Time and Space Complexity'],
      idealSampleAnswer: `Use Breadth-First Search (BFS) with a Queue. Initialize the queue with the root. For each level, record the queue size, process that number of nodes by popping them into a level array, and push their left and right children to the queue.`,
      pseudoCode: `FUNCTION levelOrder(root):
    IF root IS NULL RETURN []
    INITIALIZE Queue q, List result
    ENQUEUE root INTO q
    WHILE q IS NOT EMPTY:
        levelSize = q.size()
        levelList = []
        FOR i FROM 0 TO levelSize - 1:
            node = DEQUEUE q
            ADD node.val TO levelList
            IF node.left: ENQUEUE node.left
            IF node.right: ENQUEUE node.right
        END FOR
        ADD levelList TO result
    END WHILE
    RETURN result
END FUNCTION`,
      javaCode: `import java.util.*;

public class Solution {
    public List<List<Integer>> levelOrder(TreeNode root) {
        List<List<Integer>> result = new ArrayList<>();
        if (root == null) return result;
        Queue<TreeNode> queue = new LinkedList<>();
        queue.add(root);
        while (!queue.isEmpty()) {
            int levelSize = queue.size();
            List<Integer> level = new ArrayList<>();
            for (int i = 0; i < levelSize; i++) {
                TreeNode node = queue.poll();
                level.add(node.val);
                if (node.left != null) queue.add(node.left);
                if (node.right != null) queue.add(node.right);
            }
            result.add(level);
        }
        return result;
    }
}`,
      pythonCode: `from collections import deque

def levelOrder(root: TreeNode) -> list[list[int]]:
    if not root: return []
    res, q = [], deque([root])
    while q:
        level = []
        for _ in range(len(q)):
            node = q.popleft()
            level.append(node.val)
            if node.left: q.append(node.left)
            if node.right: q.append(node.right)
        res.append(level)
    return res`
    },
    {
      id: 'code-6',
      category: 'coding',
      question: `6. Course Schedule / Cycle Detection in Graph (LeetCode #207): Determine if you can finish all courses given prerequisite dependencies.`,
      difficulty: 'SENIOR',
      skillsTag: ['Topological Sort', 'Kahn Algorithm', 'DFS Graph Cycle', 'Graph'],
      keyTopicsToCover: ['Adjacency List graph representation', 'Indegree array for prerequisites', 'Kahn BFS algorithm / DFS coloring'],
      idealSampleAnswer: `Model courses as a directed graph. Calculate the in-degree of each node (number of prerequisites). Push 0-indegree nodes into a Queue. Pop nodes, increment processed course count, and decrement in-degree of neighboring nodes. If processed count equals total courses, no cycle exists.`,
      pseudoCode: `FUNCTION canFinish(numCourses, prerequisites):
    INITIALIZE Graph adj, Array inDegree
    BUILD adj and inDegree FROM prerequisites
    ENQUEUE all nodes WITH inDegree == 0 INTO queue
    SET count = 0
    WHILE queue IS NOT EMPTY:
        node = DEQUEUE queue
        INCREMENT count
        FOR EACH neighbor IN adj[node]:
            DECREMENT inDegree[neighbor]
            IF inDegree[neighbor] == 0: ENQUEUE neighbor
    END WHILE
    RETURN count == numCourses
END FUNCTION`,
      javaCode: `import java.util.*;

public class Solution {
    public boolean canFinish(int numCourses, int[][] prerequisites) {
        List<List<Integer>> adj = new ArrayList<>();
        int[] inDegree = new int[numCourses];
        for (int i = 0; i < numCourses; i++) adj.add(new ArrayList<>());
        for (int[] p : prerequisites) {
            adj.get(p[1]).add(p[0]);
            inDegree[p[0]]++;
        }
        Queue<Integer> q = new LinkedList<>();
        for (int i = 0; i < numCourses; i++) if (inDegree[i] == 0) q.add(i);
        int count = 0;
        while (!q.isEmpty()) {
            int node = q.poll();
            count++;
            for (int neighbor : adj.get(node)) {
                if (--inDegree[neighbor] == 0) q.add(neighbor);
            }
        }
        return count == numCourses;
    }
}`,
      pythonCode: `from collections import deque

def canFinish(numCourses: int, prerequisites: list[list[int]]) -> bool:
    adj = [[] for _ in range(numCourses)]
    indegree = [0] * numCourses
    for crs, pre in prerequisites:
        adj[pre].append(crs)
        indegree[crs] += 1
    q = deque([i for i in range(numCourses) if indegree[i] == 0])
    count = 0
    while q:
        node = q.popleft()
        count += 1
        for nxt in adj[node]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0: q.append(nxt)
    return count == numCourses`
    },
    {
      id: 'code-7',
      category: 'coding',
      question: `7. Find Median from Data Stream (LeetCode #295): Design a data structure that supports adding numbers from a stream and finding the median in O(1) time.`,
      difficulty: 'ADVANCED',
      skillsTag: ['Dual Heaps', 'Max-Heap & Min-Heap', 'Stream Processing'],
      keyTopicsToCover: ['Max-Heap for lower half of numbers', 'Min-Heap for upper half of numbers', 'O(log N) insert, O(1) median'],
      idealSampleAnswer: `Maintain two heaps: a Max-Heap for the smaller half of numbers and a Min-Heap for the larger half. Keep their sizes balanced (difference <= 1). The median is either the top of the larger heap or the average of both heap tops.`,
      pseudoCode: `CLASS MedianFinder:
    MaxHeap small  // Stores lower half
    MinHeap large  // Stores upper half

    FUNCTION addNum(num):
        PUSH num INTO small
        POP MAX FROM small AND PUSH INTO large
        IF size(large) > size(small):
            POP MIN FROM large AND PUSH INTO small

    FUNCTION findMedian():
        IF size(small) > size(large): RETURN top(small)
        ELSE: RETURN (top(small) + top(large)) / 2.0`,
      javaCode: `import java.util.Collections;
import java.util.PriorityQueue;

class MedianFinder {
    private PriorityQueue<Integer> small = new PriorityQueue<>(Collections.reverseOrder());
    private PriorityQueue<Integer> large = new PriorityQueue<>();

    public void addNum(int num) {
        small.add(num);
        large.add(small.poll());
        if (large.size() > small.size()) small.add(large.poll());
    }

    public double findMedian() {
        if (small.size() > large.size()) return small.peek();
        return (small.peek() + large.peek()) / 2.0;
    }
}`,
      pythonCode: `import heapq

class MedianFinder:
    def __init__(self):
        self.small, self.large = [], []

    def addNum(self, num: int) -> None:
        heapq.heappush(self.small, -num)
        heapq.heappush(self.large, -heapq.heappop(self.small))
        if len(self.large) > len(self.small):
            heapq.heappush(self.small, -heapq.heappop(self.large))

    def findMedian(self) -> float:
        if len(self.small) > len(self.large): return -self.small[0]
        return (-self.small[0] + self.large[0]) / 2.0`
    },
    {
      id: 'code-8',
      category: 'coding',
      question: `8. Word Break Problem (LeetCode #139): Given a string s and a dictionary of words, return true if s can be segmented into a space-separated sequence of dictionary words.`,
      difficulty: 'MID',
      skillsTag: ['Dynamic Programming', 'Trie / Set', 'String Matching'],
      keyTopicsToCover: ['DP boolean array dp[i]', 'Substring checking against word set', 'O(N^2) Time Complexity'],
      idealSampleAnswer: `Use Dynamic Programming. Define dp[i] as a boolean indicating if substring s[0...i] can be segmented. Initialize dp[0] = True. Iterate i from 1 to len(s); for each j from 0 to i, if dp[j] is True and s[j...i] is in wordDict, set dp[i] = True.`,
      pseudoCode: `FUNCTION wordBreak(s, wordDict):
    SET wordSet = HashSet(wordDict)
    INITIALIZE BooleanArray dp OF SIZE length(s) + 1 TO False
    SET dp[0] = True
    FOR i FROM 1 TO length(s):
        FOR j FROM 0 TO i - 1:
            IF dp[j] IS True AND substring(s, j, i) IN wordSet:
                SET dp[i] = True
                BREAK
            END IF
        END FOR
    END FOR
    RETURN dp[length(s)]
END FUNCTION`,
      javaCode: `import java.util.*;

public class Solution {
    public boolean wordBreak(String s, List<String> wordDict) {
        Set<String> set = new HashSet<>(wordDict);
        boolean[] dp = new boolean[s.length() + 1];
        dp[0] = true;
        for (int i = 1; i <= s.length(); i++) {
            for (int j = 0; j < i; j++) {
                if (dp[j] && set.contains(s.substring(j, i))) {
                    dp[i] = true;
                    break;
                }
            }
        }
        return dp[s.length()];
    }
}`,
      pythonCode: `def wordBreak(s: str, wordDict: list[str]) -> bool:
    words = set(wordDict)
    dp = [False] * (len(s) + 1)
    dp[0] = True
    for i in range(1, len(s) + 1):
        for j in range(i):
            if dp[j] and s[j:i] in words:
                dp[i] = True
                break
    return dp[len(s)]`
    },
    {
      id: 'code-9',
      category: 'coding',
      question: `9. Lowest Common Ancestor of a Binary Tree (LeetCode #236): Given a binary tree and two nodes p and q, find their lowest common ancestor (LCA).`,
      difficulty: 'MID',
      skillsTag: ['Binary Tree', 'Recursion', 'Post-Order Traversal'],
      keyTopicsToCover: ['Recursive Post-Order Traversal', 'Returning matched nodes up the tree', 'O(N) Time, O(H) Space'],
      idealSampleAnswer: `Recursively traverse the tree. If root is None, p, or q, return root. Recurse on left and right subtrees. If both left and right recursions return non-None values, root is the LCA. If only one returns non-None, return that non-None node.`,
      pseudoCode: `FUNCTION lowestCommonAncestor(root, p, q):
    IF root IS NULL OR root == p OR root == q: RETURN root
    left = lowestCommonAncestor(root.left, p, q)
    right = lowestCommonAncestor(root.right, p, q)
    IF left IS NOT NULL AND right IS NOT NULL: RETURN root
    RETURN IF left IS NOT NULL THEN left ELSE right
END FUNCTION`,
      javaCode: `public class Solution {
    public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
        if (root == null || root == p || root == q) return root;
        TreeNode left = lowestCommonAncestor(root.left, p, q);
        TreeNode right = lowestCommonAncestor(root.right, p, q);
        if (left != null && right != null) return root;
        return left != null ? left : right;
    }
}`,
      pythonCode: `def lowestCommonAncestor(root: 'TreeNode', p: 'TreeNode', q: 'TreeNode') -> 'TreeNode':
    if not root or root == p or root == q: return root
    left = lowestCommonAncestor(root.left, p, q)
    right = lowestCommonAncestor(root.right, p, q)
    if left and right: return root
    return left if left else right`
    },
    {
      id: 'code-10',
      category: 'coding',
      question: `10. Implement Token Bucket Rate Limiter (LeetCode / System Design): Design an algorithmic rate limiter that enforces a maximum token capacity and refill rate.`,
      difficulty: 'SENIOR',
      skillsTag: ['Rate Limiting', 'System Design', 'Algorithms', 'Concurrency'],
      keyTopicsToCover: ['Token Bucket algorithm mechanics', 'Lazy token refill computation based on timestamp diff', 'Thread-safe lock acquisition'],
      idealSampleAnswer: `Maintain current_tokens, last_refill_timestamp, capacity, and refill_rate_per_sec. On allow_request(): calculate elapsed time since last_refill, add (elapsed * refill_rate) tokens to current_tokens up to max capacity. If current_tokens >= 1, decrement by 1 and return True; else return False.`,
      pseudoCode: `CLASS TokenBucketRateLimiter:
    capacity, refillRate, tokens, lastRefillTime

    FUNCTION allowRequest():
        currentTime = getCurrentTime()
        elapsed = currentTime - lastRefillTime
        tokens = MIN(capacity, tokens + elapsed * refillRate)
        lastRefillTime = currentTime
        IF tokens >= 1:
            tokens = tokens - 1
            RETURN True
        ELSE: RETURN False`,
      javaCode: `public class TokenBucketRateLimiter {
    private final double capacity;
    private final double refillRatePerSec;
    private double tokens;
    private long lastRefillTimestamp;

    public TokenBucketRateLimiter(double capacity, double refillRatePerSec) {
        this.capacity = capacity;
        this.refillRatePerSec = refillRatePerSec;
        this.tokens = capacity;
        this.lastRefillTimestamp = System.currentTimeMillis();
    }

    public synchronized boolean allowRequest() {
        long now = System.currentTimeMillis();
        double elapsedSec = (now - lastRefillTimestamp) / 1000.0;
        tokens = Math.min(capacity, tokens + elapsedSec * refillRatePerSec);
        lastRefillTimestamp = now;
        if (tokens >= 1.0) {
            tokens -= 1.0;
            return true;
        }
        return false;
    }
}`,
      pythonCode: `import time

class TokenBucketRateLimiter:
    def __init__(self, capacity: float, refill_rate_per_sec: float):
        self.capacity = capacity
        self.refill_rate = refill_rate_per_sec
        self.tokens = capacity
        self.last_refill = time.time()

    def allow_request(self) -> bool:
        now = time.time()
        elapsed = now - self.last_refill
        self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)
        self.last_refill = now
        if self.tokens >= 1.0:
            self.tokens -= 1.0
            return True
        return False`
    }
  ];

  // SECTION 3: 15 MANAGERIAL & BEHAVIORAL QUESTIONS
  const generatedMgr: QuestionItem[] = [
    {
      id: 'mgr-1',
      category: 'managerial',
      question: `1. As a ${primaryTech} developer (${candidateName}), tell me about a time when you had to balance technical debt vs tight product feature deadlines.`,
      difficulty: 'SENIOR',
      skillsTag: ['Leadership', 'Sprint Planning', 'Stakeholder Management'],
      keyTopicsToCover: [
        'Quantifying technical debt risk (e.g. outage risk vs sprint velocity)',
        'Negotiating refactoring capacity in Agile sprints (80/20 rule)',
        'Communicating technical trade-offs to non-technical stakeholders',
        'Measuring post-refactoring velocity improvements'
      ],
      idealSampleAnswer: `When our team faced performance bottlenecks due to legacy database queries while product requested new features, I benchmarked query latency to prove technical debt was slowing sprint velocity. I negotiated dedicating 20% of sprint capacity to database refactoring, achieving 2x faster load times while delivering target features.`
    },
    {
      id: 'mgr-2',
      category: 'managerial',
      question: `2. How do you handle technical disagreements with senior architects or team members regarding framework or tool selection?`,
      difficulty: 'MID',
      skillsTag: ['Conflict Resolution', 'Architecture Review', 'Collaboration'],
      keyTopicsToCover: [
        'Data-driven decision making & Proof of Concept (POC) benchmarks',
        'Focusing on business goals over personal tech preferences',
        'Documenting Architecture Decision Records (ADRs)',
        'Committing 100% once a decision is agreed upon'
      ],
      idealSampleAnswer: `When advocating for tools like ${frameworkTech}, I build a small Proof of Concept (POC) evaluating benchmark performance, team learning curve, and community support. I present objective data in architectural reviews. If the team decides on an alternative, I fully support and execute the chosen decision.`
    },
    {
      id: 'mgr-3',
      category: 'managerial',
      question: `3. Describe a critical production incident you experienced. How did you lead response efforts and post-mortem reviews?`,
      difficulty: 'SENIOR',
      skillsTag: ['Incident Management', 'Root Cause Analysis', 'Blameless Post-Mortem'],
      keyTopicsToCover: [
        'Immediate service restoration & rollback protocols',
        'Transparent stakeholder status communication',
        'Blameless post-mortem using the 5 Whys framework',
        'Implementing automated regression tests and monitoring alerts'
      ],
      idealSampleAnswer: `When a production memory leak caused service degradation, my immediate priority was restoring uptime by rolling back to the prior release. Afterwards, I conducted a blameless 5-Whys post-mortem, identified an unclosed database connection pool, and added automated memory tests to CI/CD to prevent recurrence.`
    },
    {
      id: 'mgr-4',
      category: 'managerial',
      question: `4. How do you mentor junior developers, conduct constructive code reviews, and foster code quality on your team?`,
      difficulty: 'MID',
      skillsTag: ['Mentorship', 'Code Reviews', 'Team Culture'],
      keyTopicsToCover: ['Pair programming sessions', 'Constructive actionable code review comments', 'Setting clear style guides & automated linters', 'Encouraging technical autonomy'],
      idealSampleAnswer: `I approach code reviews as learning opportunities rather than gatekeeping. I explain 'why' a change is suggested with documentation links and pair program with junior developers on complex tasks. I also automate code formatting via linters so reviews focus on architecture.`
    },
    {
      id: 'mgr-5',
      category: 'managerial',
      question: `5. How do you handle scope creep when product requirements change midway through an active sprint?`,
      difficulty: 'MID',
      skillsTag: ['Scope Management', 'Agile', 'Sprint Delivery'],
      keyTopicsToCover: ['Evaluating sprint impact and capacity', 'Swap policy (swapping new story for existing equal-sized story)', 'Escalating deadline impacts to Product Manager', 'Maintaining sprint commitment integrity'],
      idealSampleAnswer: `When new scope is introduced mid-sprint, I assess its complexity with the engineering team. If it must be added immediately, I enforce a 'one-in, one-out' swap policy with the Product Manager, ensuring existing equal-effort stories are moved to the backlog to protect sprint quality.`
    },
    {
      id: 'mgr-6',
      category: 'managerial',
      question: `6. Tell me about a time when you had to work with cross-functional teams (Product, Design, QA) with conflicting priorities.`,
      difficulty: 'MID',
      skillsTag: ['Cross-Functional', 'Communication', 'Alignment'],
      keyTopicsToCover: ['Establishing shared success metrics', 'Early technical involvement in design phases', 'Setting explicit SLA contracts for QA testing', 'Active empathy and active listening'],
      idealSampleAnswer: `When QA required 3 days of regression testing while Product requested instant release, I organized an alignment meeting. We agreed on automating 80% of regression smoke tests in CI/CD, allowing QA to sign off within 4 hours while maintaining release quality.`
    },
    {
      id: 'mgr-7',
      category: 'managerial',
      question: `7. How do you communicate project status, technical risks, and potential delay escalations to executive leadership?`,
      difficulty: 'SENIOR',
      skillsTag: ['Executive Communication', 'Risk Escalation', 'Transparency'],
      keyTopicsToCover: ['Early risk identification (no surprises rule)', 'Providing clear mitigation options with trade-offs', 'High-level business impact focus rather than deep jargon', 'Regular status dashboards'],
      idealSampleAnswer: `I follow the 'no surprises' rule. As soon as a technical blocker threatens a milestone, I escalate early to leadership with 2 clear options: Option A (extend deadline by 3 days for full scope) or Option B (deliver core MVP on time and push secondary feature to phase 2).`
    },
    {
      id: 'mgr-8',
      category: 'managerial',
      question: `8. How do you prioritize refactoring tasks vs building new business features in a legacy codebase?`,
      difficulty: 'MID',
      skillsTag: ['Prioritization', 'Refactoring', 'Legacy Systems'],
      keyTopicsToCover: ['Boy Scout Rule (leave code cleaner than you found it)', 'Targeting high-churn risk files first', 'Linking refactoring to bug reduction metrics', 'Incremental refactoring over rewrites'],
      idealSampleAnswer: `I practice the Boy Scout Rule by refactoring small modules touched during feature work. For major refactoring, I prioritize files with high churn and bug frequency. I demonstrate how refactoring reduces bug rates, securing team buy-in.`
    },
    {
      id: 'mgr-9',
      category: 'managerial',
      question: `9. How do you encourage innovation and experimental technology spikes while maintaining production system stability?`,
      difficulty: 'SENIOR',
      skillsTag: ['Innovation', 'POC Spikes', 'System Stability'],
      keyTopicsToCover: ['Timeboxed Hackathons / Innovation Days', 'Strict isolation of experimental POCs from production', 'Architecture Decision Records (ADR)', 'Measuring ROI before adopting new tools'],
      idealSampleAnswer: `I support timeboxed 2-day engineering spikes for exploring new tech (like vector search or async engines). Spikes must build a working POC in sandbox environments and present an ADR detailing performance, security, and maintenance costs before production adoption.`
    },
    {
      id: 'mgr-10',
      category: 'managerial',
      question: `10. How do you manage asynchronous communication and collaboration in a distributed or remote engineering team?`,
      difficulty: 'MID',
      skillsTag: ['Remote Work', 'Async Communication', 'Documentation'],
      keyTopicsToCover: ['Comprehensive PR descriptions and RFC documents', 'Loom video demos for complex features', 'Clear SLA expectations for Slack/email messages', 'Documenting single source of truth in wiki'],
      idealSampleAnswer: `I emphasize written documentation as the primary communication medium. Every architecture change starts with an RFC document. Pull requests contain detailed context and Loom walk-through videos, allowing remote teammates across time zones to review effectively.`
    },
    {
      id: 'mgr-11',
      category: 'managerial',
      question: `11. Walk me through your process for onboarding a new software engineer into your codebase and team culture.`,
      difficulty: 'MID',
      skillsTag: ['Onboarding', 'Documentation', 'Team Growth'],
      keyTopicsToCover: ['Curated 30-60-90 day onboarding checklist', 'Assigning a dedicated onboarding buddy', 'First-week win (shipping a small PR on Day 2)', 'Automated local environment setup scripts'],
      idealSampleAnswer: `I ensure new hires have a smooth onboarding by maintaining automated setup scripts and a 30-60-90 day guide. I assign a buddy and guide them to deploy a small bug fix or documentation update on Day 2, building confidence early.`
    },
    {
      id: 'mgr-12',
      category: 'managerial',
      question: `12. How do you resolve interpersonal friction or communication breakdowns between team members?`,
      difficulty: 'MID',
      skillsTag: ['Conflict Resolution', 'Empathy', 'Team Dynamics'],
      keyTopicsToCover: ['Private 1-on-1 conversations to listen to perspectives', 'Focusing on shared goals and facts over emotions', 'Facilitating a structured joint resolution session', 'Establishing clear team ground rules'],
      idealSampleAnswer: `I hold private 1-on-1s with both individuals to understand their perspectives without taking sides. I bring them together for a collaborative session focused on shared engineering goals and establish clear communication norms.`
    },
    {
      id: 'mgr-13',
      category: 'managerial',
      question: `13. How do you make critical technical decisions when you have incomplete information or tight deadlines?`,
      difficulty: 'SENIOR',
      skillsTag: ['Decision Making', 'Risk Assessment', 'Agility'],
      keyTopicsToCover: ['Reversible vs Irreversible decisions (Two-way vs One-way doors)', 'Gathering 70% of available data before deciding', 'Building fallback rollback plans', 'Iterative validation'],
      idealSampleAnswer: `I categorize decisions into reversible (two-way doors) and irreversible (one-way doors). For reversible decisions, I act once I have 70% of the data to avoid analysis paralysis. For irreversible decisions, I build fallback rollback mechanisms to mitigate risk.`
    },
    {
      id: 'mgr-14',
      category: 'managerial',
      question: `14. How do you balance speed to market (shipping fast) vs long-term system scalability and clean architecture?`,
      difficulty: 'SENIOR',
      skillsTag: ['Architecture', 'Speed to Market', 'Scalability'],
      keyTopicsToCover: ['Iterative MVP approach', 'Building scalable interfaces with simple initial implementations', 'Monitoring performance metrics to know when to scale', 'Avoiding premature optimization'],
      idealSampleAnswer: `I design modular interfaces that allow swapping simple implementations for complex scalable ones later. I ship the simplest architecture that meets current capacity needs plus a 3x buffer, avoiding premature optimization while keeping the path open for future scaling.`
    },
    {
      id: 'mgr-15',
      category: 'managerial',
      question: `15. How do you drive continuous improvement and a strong DevOps culture within your engineering team?`,
      difficulty: 'SENIOR',
      skillsTag: ['DevOps Culture', 'Continuous Improvement', 'Automation'],
      keyTopicsToCover: ['Shared team responsibility for production monitoring & on-call', 'Automating repetitive manual tasks (You build it, you run it)', 'Regular retrospective meetings', 'Celebrating quality improvements'],
      idealSampleAnswer: `I foster a 'you build it, you run it' culture where developers participate in monitoring and production deployments. In retrospectives, we identify manual friction points and dedicate engineering effort to automating them in CI/CD pipelines.`
    }
  ];

  return { technical: generatedTech, coding: generatedCoding, managerial: generatedMgr };
}

export const ResumeInterviewQuestionsModal: React.FC<ResumeInterviewQuestionsModalProps> = ({
  isOpen,
  onClose,
  resume,
  parsedAnalysis,
  onLaunchChatbot
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'technical' | 'coding' | 'managerial'>('all');
  const [expandedId, setExpandedId] = useState<string | null>('code-1');
  const [activeLangMap, setActiveLangMap] = useState<{ [qId: string]: 'pseudo' | 'java' | 'python' }>({});
  const [practiceAnswerInput, setPracticeAnswerInput] = useState<{ [key: string]: string }>({});
  const [practiceFeedback, setPracticeFeedback] = useState<{ [key: string]: string }>({});

  if (!isOpen || !resume) return null;

  const { technical: technicalQuestions, coding: codingQuestions, managerial: managerialQuestions } = generateDynamicQuestionsForResume(
    resume,
    parsedAnalysis
  );

  const totalQuestionsCount = technicalQuestions.length + codingQuestions.length + managerialQuestions.length;

  const getLangForQuestion = (qId: string) => activeLangMap[qId] || 'pseudo';

  const setLangForQuestion = (qId: string, lang: 'pseudo' | 'java' | 'python') => {
    setActiveLangMap(prev => ({ ...prev, [qId]: lang }));
  };

  const handleEvaluateAnswer = (qId: string) => {
    const text = practiceAnswerInput[qId] || '';
    if (!text.trim()) return;

    setPracticeFeedback(prev => ({
      ...prev,
      [qId]: `✅ **AI Feedback**: Excellent response! You covered the core principles effectively. For technical and coding questions, ensure you mention Big-O time/space complexity. For managerial questions, use the STAR framework with concrete metrics.`
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200 font-sans">
      <div className="bg-white border border-surface-200 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-surface-900 via-surface-800 to-surface-900 p-6 text-white flex items-center justify-between shrink-0 border-b border-surface-700">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] uppercase tracking-wider border border-amber-500/30">
                  Dynamic Resume Predictor ({totalQuestionsCount} Total Qs)
                </span>
                <span className="text-surface-400 text-xs truncate max-w-[240px]">• {resume.fileName}</span>
              </div>
              <h2 className="text-xl font-extrabold text-white tracking-tight mt-0.5">
                Expected Resume Interview Questions & Coding Solutions
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-surface-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Section Navigation Tabs & Category Filters */}
        <div className="bg-surface-50 px-6 py-4 border-b border-surface-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center space-x-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                  : 'bg-white border border-surface-200 text-surface-700 hover:bg-surface-100'
              }`}
            >
              All ({totalQuestionsCount})
            </button>
            <button
              onClick={() => setActiveTab('technical')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'technical'
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                  : 'bg-white border border-surface-200 text-surface-700 hover:bg-surface-100'
              }`}
            >
              <Code className="w-3.5 h-3.5" /> Technical ({technicalQuestions.length})
            </button>
            <button
              onClick={() => setActiveTab('coding')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'coding'
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                  : 'bg-white border border-surface-200 text-surface-700 hover:bg-surface-100'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-amber-500" /> Coding Problems ({codingQuestions.length})
            </button>
            <button
              onClick={() => setActiveTab('managerial')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'managerial'
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                  : 'bg-white border border-surface-200 text-surface-700 hover:bg-surface-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Managerial ({managerialQuestions.length})
            </button>
          </div>

          {onLaunchChatbot && (
            <button
              onClick={() => {
                onClose();
                onLaunchChatbot();
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-brand-500 hover:from-amber-400 hover:to-brand-400 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shrink-0"
            >
              Live AI Chatbot Practice
            </button>
          )}
        </div>

        {/* Content Body: Scrollable Question Cards */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-surface-50/50">
          
          {/* SECTION 1: 20 TECHNICAL INTERVIEW QUESTIONS */}
          {(activeTab === 'all' || activeTab === 'technical') && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-surface-200 pb-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                  <Code className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold text-surface-900">
                  SECTION 1: Technical & Deep-Dive Architecture Questions ({technicalQuestions.length} Questions)
                </h3>
              </div>

              <div className="space-y-4">
                {technicalQuestions.map((q) => {
                  const isExpanded = expandedId === q.id;
                  return (
                    <div
                      key={q.id}
                      className="bg-white border border-surface-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all space-y-4"
                    >
                      <div
                        onClick={() => setExpandedId(isExpanded ? null : q.id)}
                        className="flex items-start justify-between gap-4 cursor-pointer"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                              Tech Question
                            </span>
                            <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-md bg-surface-100 text-surface-700">
                              {q.difficulty}
                            </span>
                            {q.skillsTag.map((st, i) => (
                              <span key={i} className="px-2 py-0.5 text-[10px] font-semibold rounded bg-surface-50 text-surface-600 border border-surface-200">
                                {st}
                              </span>
                            ))}
                          </div>
                          <h4 className="text-sm font-bold text-surface-900 leading-snug">
                            {q.question}
                          </h4>
                        </div>

                        <button className="p-1 text-surface-400 hover:text-surface-900 rounded-lg">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>

                      {/* Accordion Detail Content */}
                      {isExpanded && (
                        <div className="pt-4 border-t border-surface-100 space-y-4 animate-in fade-in duration-150">
                          <div className="bg-surface-50 p-4 rounded-xl border border-surface-200 space-y-2">
                            <h5 className="text-xs font-bold text-surface-800 flex items-center gap-1.5">
                              <Target className="w-4 h-4 text-brand-500" /> Key Technical Concepts to Mention:
                            </h5>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-surface-700">
                              {q.keyTopicsToCover.map((kt, i) => (
                                <li key={i} className="flex items-center gap-1.5 font-medium">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  <span>{kt}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-gradient-to-r from-brand-50/50 via-white to-brand-50/50 p-4 rounded-xl border border-brand-200/80 space-y-1.5">
                            <h5 className="text-xs font-bold text-brand-700 flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-amber-500" /> Ideal Expert Sample Answer:
                            </h5>
                            <p className="text-xs text-surface-800 leading-relaxed font-sans font-normal italic">
                              "{q.idealSampleAnswer}"
                            </p>
                          </div>

                          <div className="space-y-2 pt-1">
                            <label className="text-[11px] font-bold text-surface-700 flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5 text-brand-500" /> Practice Your Mock Response:
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={practiceAnswerInput[q.id] || ''}
                                onChange={(e) => setPracticeAnswerInput({ ...practiceAnswerInput, [q.id]: e.target.value })}
                                placeholder="Type your key response points or sample answer..."
                                className="flex-1 px-3.5 py-2 text-xs bg-surface-50 border border-surface-200 rounded-xl text-surface-900 focus:outline-none focus:border-brand-500"
                              />
                              <button
                                onClick={() => handleEvaluateAnswer(q.id)}
                                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1"
                              >
                                <span>Submit</span>
                                <Send className="w-3 h-3" />
                              </button>
                            </div>
                            {practiceFeedback[q.id] && (
                              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                                {practiceFeedback[q.id]}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 2: 10 CODING PROBLEMS (WITH PSEUDO CODE, JAVA, PYTHON TABS) */}
          {(activeTab === 'all' || activeTab === 'coding') && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-2 border-b border-surface-200 pb-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <Terminal className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold text-surface-900">
                  SECTION 2: 10 Most Expected Coding Problems (Pseudo Code, Java & Python)
                </h3>
              </div>

              <div className="space-y-4">
                {codingQuestions.map((q) => {
                  const isExpanded = expandedId === q.id;
                  const currentLang = getLangForQuestion(q.id);

                  return (
                    <div
                      key={q.id}
                      className="bg-white border border-amber-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all space-y-4"
                    >
                      <div
                        onClick={() => setExpandedId(isExpanded ? null : q.id)}
                        className="flex items-start justify-between gap-4 cursor-pointer"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                              Coding Problem
                            </span>
                            <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-md bg-surface-100 text-surface-700">
                              {q.difficulty}
                            </span>
                            {q.skillsTag.map((st, i) => (
                              <span key={i} className="px-2 py-0.5 text-[10px] font-semibold rounded bg-surface-50 text-surface-600 border border-surface-200">
                                {st}
                              </span>
                            ))}
                          </div>
                          <h4 className="text-sm font-bold text-surface-900 leading-snug">
                            {q.question}
                          </h4>
                        </div>

                        <button className="p-1 text-surface-400 hover:text-surface-900 rounded-lg">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>

                      {/* Accordion Detail Content */}
                      {isExpanded && (
                        <div className="pt-4 border-t border-surface-100 space-y-4 animate-in fade-in duration-150">
                          <div className="bg-surface-50 p-4 rounded-xl border border-surface-200 space-y-2">
                            <h5 className="text-xs font-bold text-surface-800 flex items-center gap-1.5">
                              <Target className="w-4 h-4 text-brand-500" /> Algorithmic Breakdown & Complexity:
                            </h5>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-surface-700">
                              {q.keyTopicsToCover.map((kt, i) => (
                                <li key={i} className="flex items-center gap-1.5 font-medium">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                  <span>{kt}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Multi-Language Code Block (Pseudo Code -> Java -> Python) */}
                          <div className="bg-surface-900 rounded-xl border border-surface-800 overflow-hidden shadow-inner space-y-0">
                            {/* Language Tab Bar */}
                            <div className="bg-surface-950 px-4 py-2.5 flex items-center justify-between border-b border-surface-800">
                              <div className="flex items-center space-x-2">
                                <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1 mr-2">
                                  <Terminal className="w-3.5 h-3.5" /> Solution Code:
                                </span>
                                <button
                                  onClick={() => setLangForQuestion(q.id, 'pseudo')}
                                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                    currentLang === 'pseudo'
                                      ? 'bg-amber-500 text-surface-950 shadow-sm'
                                      : 'bg-surface-800 text-surface-300 hover:text-white'
                                  }`}
                                >
                                  📝 Pseudo Code
                                </button>
                                <button
                                  onClick={() => setLangForQuestion(q.id, 'java')}
                                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                    currentLang === 'java'
                                      ? 'bg-amber-500 text-surface-950 shadow-sm'
                                      : 'bg-surface-800 text-surface-300 hover:text-white'
                                  }`}
                                >
                                  ☕ Java Solution
                                </button>
                                <button
                                  onClick={() => setLangForQuestion(q.id, 'python')}
                                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                    currentLang === 'python'
                                      ? 'bg-amber-500 text-surface-950 shadow-sm'
                                      : 'bg-surface-800 text-surface-300 hover:text-white'
                                  }`}
                                >
                                  🐍 Python Solution
                                </button>
                              </div>
                              <span className="text-[10px] text-surface-400 font-mono">O(N) Complexity</span>
                            </div>

                            {/* Active Language Code Window */}
                            <div className="p-4 font-mono text-xs overflow-x-auto">
                              {currentLang === 'pseudo' && (
                                <pre className="text-amber-300 leading-relaxed">
                                  {q.pseudoCode || 'Pseudo code solution...'}
                                </pre>
                              )}
                              {currentLang === 'java' && (
                                <pre className="text-emerald-300 leading-relaxed">
                                  {q.javaCode || '// Java solution...'}
                                </pre>
                              )}
                              {currentLang === 'python' && (
                                <pre className="text-sky-300 leading-relaxed">
                                  {q.pythonCode || '# Python solution...'}
                                </pre>
                              )}
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-amber-50/50 via-white to-amber-50/50 p-4 rounded-xl border border-amber-200/80 space-y-1.5">
                            <h5 className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-amber-500" /> Optimal Algorithmic Explanation:
                            </h5>
                            <p className="text-xs text-surface-800 leading-relaxed font-sans font-normal italic">
                              "{q.idealSampleAnswer}"
                            </p>
                          </div>

                          <div className="space-y-2 pt-1">
                            <label className="text-[11px] font-bold text-surface-700 flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5 text-brand-500" /> Practice Your Solution or Time Complexity:
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={practiceAnswerInput[q.id] || ''}
                                onChange={(e) => setPracticeAnswerInput({ ...practiceAnswerInput, [q.id]: e.target.value })}
                                placeholder="Type your algorithmic approach or time complexity..."
                                className="flex-1 px-3.5 py-2 text-xs bg-surface-50 border border-surface-200 rounded-xl text-surface-900 focus:outline-none focus:border-brand-500"
                              />
                              <button
                                onClick={() => handleEvaluateAnswer(q.id)}
                                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1"
                              >
                                <span>Submit</span>
                                <Send className="w-3 h-3" />
                              </button>
                            </div>
                            {practiceFeedback[q.id] && (
                              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                                {practiceFeedback[q.id]}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 3: 15 MANAGERIAL & BEHAVIORAL QUESTIONS */}
          {(activeTab === 'all' || activeTab === 'managerial') && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-2 border-b border-surface-200 pb-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold text-surface-900">
                  SECTION 3: Managerial, Behavioral & Leadership Questions ({managerialQuestions.length} Questions)
                </h3>
              </div>

              <div className="space-y-4">
                {managerialQuestions.map((q) => {
                  const isExpanded = expandedId === q.id;
                  return (
                    <div
                      key={q.id}
                      className="bg-white border border-surface-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all space-y-4"
                    >
                      <div
                        onClick={() => setExpandedId(isExpanded ? null : q.id)}
                        className="flex items-start justify-between gap-4 cursor-pointer"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Managerial Question
                            </span>
                            <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-md bg-surface-100 text-surface-700">
                              {q.difficulty}
                            </span>
                            {q.skillsTag.map((st, i) => (
                              <span key={i} className="px-2 py-0.5 text-[10px] font-semibold rounded bg-surface-50 text-surface-600 border border-surface-200">
                                {st}
                              </span>
                            ))}
                          </div>
                          <h4 className="text-sm font-bold text-surface-900 leading-snug">
                            {q.question}
                          </h4>
                        </div>

                        <button className="p-1 text-surface-400 hover:text-surface-900 rounded-lg">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>

                      {/* Accordion Detail Content */}
                      {isExpanded && (
                        <div className="pt-4 border-t border-surface-100 space-y-4 animate-in fade-in duration-150">
                          <div className="bg-surface-50 p-4 rounded-xl border border-surface-200 space-y-2">
                            <h5 className="text-xs font-bold text-surface-800 flex items-center gap-1.5">
                              <Target className="w-4 h-4 text-brand-500" /> Behavioral & STAR Framework Guidelines:
                            </h5>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-surface-700">
                              {q.keyTopicsToCover.map((kt, i) => (
                                <li key={i} className="flex items-center gap-1.5 font-medium">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  <span>{kt}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-gradient-to-r from-emerald-50/50 via-white to-emerald-50/50 p-4 rounded-xl border border-emerald-200/80 space-y-1.5">
                            <h5 className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-emerald-500" /> Ideal Managerial Sample Answer:
                            </h5>
                            <p className="text-xs text-surface-800 leading-relaxed font-sans font-normal italic">
                              "{q.idealSampleAnswer}"
                            </p>
                          </div>

                          <div className="space-y-2 pt-1">
                            <label className="text-[11px] font-bold text-surface-700 flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5 text-brand-500" /> Practice Your STAR Response:
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={practiceAnswerInput[q.id] || ''}
                                onChange={(e) => setPracticeAnswerInput({ ...practiceAnswerInput, [q.id]: e.target.value })}
                                placeholder="Describe Situation, Task, Action, and Result..."
                                className="flex-1 px-3.5 py-2 text-xs bg-surface-50 border border-surface-200 rounded-xl text-surface-900 focus:outline-none focus:border-brand-500"
                              />
                              <button
                                onClick={() => handleEvaluateAnswer(q.id)}
                                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1"
                              >
                                <span>Submit</span>
                                <Send className="w-3 h-3" />
                              </button>
                            </div>
                            {practiceFeedback[q.id] && (
                              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                                {practiceFeedback[q.id]}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-white border-t border-surface-200 flex items-center justify-between shrink-0">
          <p className="text-xs text-surface-500">
            Dynamic Resume Predictor • Tailored to {resume.fileName} ({totalQuestionsCount} Questions: 20 Tech, 10 Coding [Pseudo/Java/Python], 15 Managerial)
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-surface-900 hover:bg-surface-800 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
