package org.wickedsource.coderadar.metricquery.rest.module;

import org.junit.Test;

import java.util.Arrays;

import static org.assertj.core.api.Assertions.assertThat;

public class MetricsTreeResourceTest {

    @Test
    public void addedModulesAreNestedCorrectly() {
        MetricsTreeResource tree = new MetricsTreeResource(null, null, null);
        tree.addModules(Arrays.asList("server/foo/module1",
                "server/foo/module1/submodule1",
                "server/foo/module1/submodule2",
                "server/foo/module1/submodule1/subsubmodule3",
                "server/foo/bar/module4/submodule5",
                "server/foo/bar/module6/submodule7"), (module -> new MetricValuesSet()));

        assertThat(tree.getChildren()).hasSize(3);
        assertThat(tree.getChildren().get(0).getName()).isEqualTo("server/foo/bar/module4/submodule5");
        assertThat(tree.getChildren().get(0).getChildren()).hasSize(0);
        assertThat(tree.getChildren().get(1).getName()).isEqualTo("server/foo/bar/module6/submodule7");
        assertThat(tree.getChildren().get(1).getChildren()).hasSize(0);
        assertThat(tree.getChildren().get(2).getName()).isEqualTo("server/foo/module1");
        assertThat(tree.getChildren().get(2).getChildren()).hasSize(2);
        assertThat(tree.getChildren().get(2).getChildren().get(0).getName()).isEqualTo("server/foo/module1/submodule1");
        assertThat(tree.getChildren().get(2).getChildren().get(1).getName()).isEqualTo("server/foo/module1/submodule2");
    }

}