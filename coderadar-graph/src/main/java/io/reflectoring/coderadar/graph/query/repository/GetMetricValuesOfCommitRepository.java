package io.reflectoring.coderadar.graph.query.repository;

import io.reflectoring.coderadar.graph.projectadministration.domain.CommitEntity;
import io.reflectoring.coderadar.graph.query.domain.MetricValueForCommitQueryResult;
import io.reflectoring.coderadar.graph.query.domain.MetricValueForCommitTreeQueryResult;
import java.util.List;
import org.springframework.data.neo4j.annotation.Query;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;

@Repository
public interface GetMetricValuesOfCommitRepository extends Neo4jRepository<CommitEntity, Long> {

  @Query(
      "MATCH (p:ProjectEntity) WHERE ID(p) = {0}  "
          + "MATCH (p)-[:CONTAINS_COMMIT]->(c)<-[:CHANGED_IN]-(f) WHERE "
          + "c.timestamp <= {2} WITH DISTINCT f "
          + "OPTIONAL MATCH (f)-[:RENAMED_FROM]->(f2) WITH collect(DISTINCT f2) AS renames "
          + "OPTIONAL MATCH (f)-[:CHANGED_IN {changeType: \"DELETE\"}]->(c:CommitEntity)<-[:CONTAINS_COMMIT]-(p:ProjectEntity) WHERE ID(p) = {0} AND "
          + "c.timestamp <= {2} WITH collect(DISTINCT f) AS deletes, renames "
          + "MATCH (p:ProjectEntity)-[:CONTAINS_COMMIT]->(c)<-[:VALID_FOR]-(m)<-[:MEASURED_BY]-(f) "
          + "WHERE ID(p) = {0} AND c.timestamp <= {2} AND NOT(f IN deletes OR f IN renames) AND m.name in {1} WITH f, m ORDER BY c.timestamp DESC "
          + "WITH f.path AS path, m.name AS name, head(collect(m.value)) AS value "
          + "RETURN name, SUM(value) AS value")
  @NonNull
  List<MetricValueForCommitQueryResult> getMetricValuesForCommit(
      @NonNull Long projectId, @NonNull List<String> metricNames, @NonNull Long date);

  @Query(
      "MATCH (p:ProjectEntity) WHERE ID(p) = {0}  "
          + "MATCH (p)-[:CONTAINS_COMMIT]->(c)<-[:CHANGED_IN]-(f) WHERE "
          + "c.timestamp <= {2} WITH DISTINCT f "
          + "OPTIONAL MATCH (f)-[:RENAMED_FROM]->(f2) WITH collect(DISTINCT f2) AS renames "
          + "OPTIONAL MATCH (f)-[:CHANGED_IN {changeType: \"DELETE\"}]->(c:CommitEntity)<-[:CONTAINS_COMMIT]-(p:ProjectEntity) WHERE ID(p) = {0} AND "
          + " c.timestamp <= {2} WITH collect(DISTINCT f) AS deletes, renames "
          + "MATCH (p:ProjectEntity)-[:CONTAINS_COMMIT]->(c)<-[:VALID_FOR]-(m)<-[:MEASURED_BY]-(f) "
          + "WHERE ID(p) = {0} AND c.timestamp <= {2} AND NOT(f IN deletes OR f IN renames) AND m.name in {1} WITH f, m ORDER BY c.timestamp DESC "
          + "WITH f.path AS path, m.name AS name, head(collect(m.value)) AS value "
          + "RETURN path, collect({name: name, value: value}) AS metrics ORDER BY path")
  @NonNull
  List<MetricValueForCommitTreeQueryResult> getMetricTreeForCommit(
      @NonNull Long projectId, @NonNull List<String> metricNames, @NonNull Long date);
}
