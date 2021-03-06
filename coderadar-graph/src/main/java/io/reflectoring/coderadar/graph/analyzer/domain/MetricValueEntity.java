package io.reflectoring.coderadar.graph.analyzer.domain;

import io.reflectoring.coderadar.analyzer.domain.MetricValue;
import io.reflectoring.coderadar.graph.projectadministration.domain.CommitEntity;
import io.reflectoring.coderadar.graph.projectadministration.domain.FileEntity;
import java.util.ArrayList;
import java.util.List;
import lombok.*;
import org.neo4j.ogm.annotation.NodeEntity;
import org.neo4j.ogm.annotation.Relationship;

/** @see MetricValue */
@Data
@AllArgsConstructor
@NoArgsConstructor
@NodeEntity
@EqualsAndHashCode
public class MetricValueEntity {
  private Long id;
  private String name;
  private Long value;

  @Relationship(type = "VALID_FOR")
  @ToString.Exclude
  private CommitEntity commit;

  @Relationship(type = "LOCATED_IN")
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private List<FindingEntity> findings = new ArrayList<>();

  @Relationship(type = "MEASURED_BY", direction = Relationship.INCOMING)
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private FileEntity file;
}
