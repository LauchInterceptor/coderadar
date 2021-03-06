package io.reflectoring.coderadar.analyzer.port.driver;

public interface StartAnalyzingUseCase {

  /**
   * Starts the analysis of a project.
   *
   * @param projectId The id of the project to analyze.
   */
  void start(Long projectId);
}
