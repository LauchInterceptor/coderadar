package io.reflectoring.coderadar.query.service;

import io.reflectoring.coderadar.analyzer.domain.GroupedMetricValueDTO;
import io.reflectoring.coderadar.query.port.driven.GetMetricsForAllFilesInCommitPort;
import io.reflectoring.coderadar.query.port.driver.GetMetricsForAllFilesInCommitCommand;
import io.reflectoring.coderadar.query.port.driver.GetMetricsForAllFilesInCommitUseCase;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class GetMetricsForAllFilesInCommitService implements GetMetricsForAllFilesInCommitUseCase {
  private final GetMetricsForAllFilesInCommitPort getMetricsForAllFilesInCommitPort;

  @Autowired
  public GetMetricsForAllFilesInCommitService(
      GetMetricsForAllFilesInCommitPort getMetricsForAllFilesInCommitPort) {
    this.getMetricsForAllFilesInCommitPort = getMetricsForAllFilesInCommitPort;
  }

  @Override
  public List<GroupedMetricValueDTO> get(GetMetricsForAllFilesInCommitCommand command) {
    return getMetricsForAllFilesInCommitPort.get(command);
  }
}
