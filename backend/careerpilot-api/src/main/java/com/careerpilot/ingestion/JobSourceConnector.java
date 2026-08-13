package com.careerpilot.ingestion;

import java.util.List;

public interface JobSourceConnector {
    /**
     * Fetches raw job postings from the configured data source.
     * @return List of RawJobData items
     */
    List<RawJobData> fetchRawJobs();

    /**
     * Returns the unique string identifier for this job source (e.g. "SEED_DATA").
     */
    String getSourceName();
}
