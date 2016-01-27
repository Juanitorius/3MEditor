/*
 * Copyright 2014-2015 Institute of Computer Science,
 * Foundation for Research and Technology - Hellas
 *
 * Licensed under the EUPL, Version 1.1 or - as soon they will be approved
 * by the European Commission - subsequent versions of the EUPL (the "Licence");
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 *
 * http://ec.europa.eu/idabc/eupl
 *
 * Unless required by applicable law or agreed to in writing, software distributed
 * under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Licence for the specific language governing permissions and limitations
 * under the Licence.
 *
 * Contact:  POBox 1385, Heraklio Crete, GR-700 13 GREECE
 * Tel:+30-2810-391632
 * Fax: +30-2810-391638
 * E-mail: isl@ics.forth.gr
 * http://www.ics.forth.gr/isl
 *
 * Authors : Georgios Samaritakis, Konstantina Konsolaki.
 *
 * This file is part of the 3MEditor webapp of Mapping Memory Manager project.
 */

var comboAPI, goAhead;
var clipboard = {
    "mapping": "",
    "link": ""
};
var clipBoardValue = "";
var sourcePaths = "mini";
var targetPaths = "mini";
var targetRoot = "";

$(document).ready(function() {


    $('.description').popover({
        trigger: "hover",
        placement: "right"
    });

    $("#matching_table").on("click", ".collapseExpand", function() {
        $(this).parentsUntil("thead").parent().next("tbody").children("tr.path, tr.range").toggle();
    });

    $("#matching_table").on("click", ".columnShow", function() {
        var $this = $(this);
        var colName = $this.closest("th").attr('class');
        $("." + colName).toggle();
        $("." + colName + ":hidden").remove();
    });

    $("#matching_table").on("click", ".columnHide", function() {
        var $this = $(this);
        var colName = $this.closest("th").attr('class');
        $("th." + colName).hide().after("<th class='" + colName + "'><i title='Click to expand column' class='columnShow fa fa-arrow-right'></i></th>");
        $("td." + colName).hide().after("<td class='" + colName + "'>&#160;</td>");
    });


    if (mode === 0) {
        comboAPI = $('#targetAnalyzer input:radio:checked').val();


        $('#table_view-btn').click(function() {

            $("body").css("opacity", "0.4");

            var url = "GetPart?id=" + id + "&part=mappings&mode=view";
            var $btn = $(this);
            $btn.button('loading');
            $.post(url).done(function(data) {
                $("#matching_table>div.mappings").html(data);
                if (sourcePaths === "full") {
                    $(".sourcePath").each(function(index) {
                        var $sourcePathSpan = $(this);
                        findProperPathValue($sourcePathSpan);
                    });
                }
                if (targetPaths === "full") {
                    $(".targetPath").each(function(index) {
                        var $targetPathSpan = $(this);
                        findProperPathValue($targetPathSpan);
                    });
                }
                $btn.button('reset');
                $('.description').popover({
                    trigger: "hover",
                    placement: "right"
                });

                $('.collapseExpand').click(function() {
                    $(this).parentsUntil(".empty").parent().prevAll("tr.path, tr.range").toggle();
                });
                $(".empty").find("div.row").css("display", "block");
                $("body").css("opacity", "1");


            })
                    .fail(function() {
                        alert("Connection with server lost. Action failed!");
                        $("body").css("opacity", "1");
                    });


        });
        $('#collapseExpandAll-btn').click(function() {
            $("tr.path, tr.range").toggle();
        });
        $('#scrollTop-btn').click(function() {
            $("html, body").animate({scrollTop: 0}, "slow");
        });
        $('#scrollBottom-btn').click(function() {
            $("html, body").animate({scrollTop: $(document).height()}, "slow");
        });
        $('#info_rawXML-btn, #rawXML-btn').click(function() {
            $("#myModal").find("textarea").val("");
            var xpath = "";

            if ($(".active").children("a").html() === "Info") {
                xpath = "//x3ml/*[name()='info' or name()='namespaces']";

            } else {
                if ($(".edit").length === 0) { //All
                    xpath = "//x3ml/mappings";
                } else if ($(".edit").length === 1) { //Domain
                    xpath = $(".edit").attr("data-xpath");
                } else if ($(".edit").length === 2) {//Link
                    xpath = $(".edit").attr("data-xpath");
                    xpath = xpath + "/..";
                } else if ($(".edit").length === 3) {//New map
                    xpath = $(".edit").attr("data-xpath");
                    xpath = xpath + "/..";
                }
            }
            $("#myModal").find(".xpath").html(xpath);

            var url = "Action?id=" + id + "&xpath=" + xpath + "&action=raw";
            $.post(url).done(function(data) {
                $("#myModal").find("textarea").val(data);
            });


            $("#myModal").modal('show');

        });
    } else if (mode === 2) {
        if (generatorsStatus === "auto") {
            getInstanceGeneratorNamesAndFillCombos();
        } else {
            fillInstanceCombos(".arg");
        }
    }





});

function getInstanceGeneratorNamesAndFillCombos() {
    var url = "Services?id=" + id + "&method=instanceGeneratorNames";
    $.ajax({
        url: url,
        dataType: 'json'
    }).success(function(data) {
        instanceGeneratorsNames = data;
//        alert(instanceGeneratorsNames)
        fillInstanceCombos();
    });
}

$('.saveXML-btn').click(function() {
    if (confirm("This is an action that may cause data loss. Are you sure you want to proceed?") === true) {

        var value = $(".modal-body").children("textarea").val();
        var xpath = $("#myModal").find(".xpath").html();


        var url = "Update?id=" + id + "&xpath=" + xpath + "&action=raw";
        $.post(url, {value: value}).done(function(data) {


            if (data.indexOf("Update complete!)" !== -1)) {
                if (xpath.indexOf("'namespaces'") !== -1) {
                    var infoVisible = $("#info_edit-btn").is(":visible");
                    var mode = "edit";
                    if (infoVisible === true) {
                        mode = "view";
                    }
                    var url = "GetPart?id=" + id + "&part=info&mode=" + mode;
                    $.post(url).done(function(data) {
                        $("#info>div").html(data);
                    })
                            .fail(function() {
                                alert("Connection with server lost. Action failed!");
                            });

                } else if (xpath.endsWith("/domain/..") || xpath.endsWith("/mappings")) {

                    if (xpath.endsWith("/mappings")) {
                        if (comboAPI > 0 && targetType === "xml") {
                            comboAPI = 4;
                        }
                        var url = "GetPart?id=" + id + "&xpath=" + xpath + "&mode=view&targetAnalyzer=" + comboAPI + "&sourceAnalyzer=" + sourceAnalyzer;
                        $.post(url).done(function(data) {
                            $(".mappings").html(data);
                        }).fail(function() {
                            alert("Connection with server lost. Action failed!");
                        });
                    } else {
                        viewOnly(); //Would be tough otherwise
                    }
                } else {

                    var editPath;
                    if (xpath.endsWith("/domain")) {
                        editPath = xpath;
                    } else if (xpath.endsWith("/path/..")) {
                        editPath = xpath.replaceAll("/path/..", "");
                    }

                    //First make clicked part editable
                    if (comboAPI > 0 && targetType === "xml") {
                        comboAPI = 4;
                    }
                    var url = "GetPart?id=" + id + "&xpath=" + editPath + "&mode=edit&targetAnalyzer=" + comboAPI + "&sourceAnalyzer=" + sourceAnalyzer;
                    $.post(url).done(function(data) {

                        if (xpath.endsWith("/domain")) {
                            $(".edit").replaceWith(data);
                        } else if (xpath.endsWith("/path/..")) {
                            $(".edit").remove();
                            $(".dummyDomain").after(data);
                        }
                        fillCombos();
                        $(".types").each(function() {
                            var $this = $(this);
                            if ($this.children(".type").length === 1) {
                                $this.children(".type").find(".input-group-btn").css("visibility", "hidden");
                            }
                        });

                    }).fail(function() {
                        alert("Connection with server lost. Action failed!");
                    });

                }



            }
            alert(data); //DO NOT DELETE! Useful alert!
            $('#myModal').modal('hide');
        });
    }
});


$('.nav a').click(function(e) {
    e.preventDefault();
    if ($(this).html() === "About") {
        $("#about").load("readme.html");
    } else if ($(this).html() === "Analysis") {
        $("#graph").load("analysis.html");
    } else if ($(this).html() === "Transformation") {
        $("#x3mlEngine").load(("x3mlEngine.html"), function() {
            var sourceFilename = "";
            if ($("info_view-btn").is(':visible')) {//edit_mode
                sourceFilename = $("div:visible>a:contains('view xml')").attr("title");
            } else {
                sourceFilename = $("a:contains('view xml')").attr("title");
            }
//            alert(sourceFilename)
            var url = "FetchBinFile?file=" + sourceFilename;
            $.post(url, "xml").done(function(xml) {
                var xmlString = (new XMLSerializer()).serializeToString(xml);

                $("#sourceFile").val(xmlString);
            });

//            var generatorPolicyFilename = $("a:contains('view generator xml')").attr("href");
//            var url = "FetchBinFile?file=" + generatorPolicyFilename;
            var url = "";
            if ($("info_view-btn").is(':visible')) {//edit_mode
                url = $("div:visible>a:contains('view generator xml')").attr("href");
            } else {
                url = $("a:contains('view generator xml')").attr("href");
            }

//            alert(url)
            $.post(url, "xml").done(function(xml) {
                var xmlString = (new XMLSerializer()).serializeToString(xml);

                $("#generator").val(xmlString);
            });

        });

    }
});

$("body").on("click", "#runEngine", function() {

    $("#engineResult").html("");

    var output = $(".outputFormat  label.active input").val();
    $(".loader").show();

    var source = $("#sourceFile").val();
    var url = "/x3mlMapper/Index?id=" + id + "&generator=" + $("#generator").val() + "&uuidSize=" + $("#uuidSize").val() + "&output=" + output;

    $.post(url, {sourceFile: source}, "html").done(function(data) {


        data = String(data).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        $(".loader").hide();
        $("#engineResult").html(data);
    });
});
function  confirmDialog() {
    confirmDialog("");
}

function viewGraph() {
    window.open('/Maze/singlemapping.html?id=' + id, '_blank');
//    window.open('/MappingAnalyzerServer/singlex3ml.html?id=' + id, '_blank');
    return false;
}


function  confirmDialog(type) {
    if (type === "Mapping") {
        goAhead = confirm("This action will delete all mapping contents! Are you sure?");
    } else if (type === "GeneratorName") {
        goAhead = confirm("This action will replace all generator arguments! Are you sure?");
    } else {
        goAhead = confirm("Are you sure?");
    }
}


$("#matching_table").on("click", ".clickable", function() {
    if (mode === 0) {
        $("body").css("opacity", "0.4");
        var $path = $(this);
        if ($path.hasClass("empty")) {

            $("body").css("opacity", "1");
        } else {


            //First make clicked part editable
            if (comboAPI > 0 && targetType === "xml") {
                comboAPI = 4;
            }
            var url = "GetPart?id=" + id + "&xpath=" + $path.attr("data-xpath") + "&mode=edit&targetAnalyzer=" + comboAPI + "&sourceAnalyzer=" + sourceAnalyzer;
            $.post(url).done(function(data) {

                //Adding header and domain to help editing
                var $data = $(data);
                //Creating buttonGroup from hidden actions cell
                var $buttonGroup = $data.find(".actions");
                $buttonGroup.children("div").addClass("btn-group-xs").removeClass("btn-group-vertical");
                $buttonGroup.find("button").addClass("btn-default").removeClass("close").removeClass("closeLike").addClass("btn-xs").removeClass("btn-sm");
                $buttonGroup.find("span").removeClass("smallerIcon");
                $buttonGroup.find("button").last().addClass("closeOnHeader");
                var buttonGroupHtml = $buttonGroup.html();
                buttonGroupHtml = buttonGroupHtml.replaceAll("<br>", "");
                //Creating dummy header row and adding buttonGroup
//                var $head = $("thead").clone();
                var $head = $("thead").first().clone();//Changed because I do not need all theads!

                $head.find("button").remove(); //Removing umwanted collapse/expand button
                var $newHead = $head.find("th"); //No need to slice now, since I only get first thead                
//                var $newHead = $head.find("th").slice(0, 5);
                var $newHeadCells = $("<tr/>").append($newHead);
                $newHeadCells.find("th").last().append($(buttonGroupHtml));
                var theadRow = "<tr class='dummyHeader'>" + $newHeadCells.html() + "</tr>";
                var $theadRow = $(theadRow);
                var domainRow = "<tr class='dummyDomain'/>";
                $path.hide();
                if ($path.hasClass("domain")) {

                    //Show/hide paste accordingly
                    if (clipboard["mapping"] === "") {
                        $theadRow.find(".paste").hide();
                    }
                } else {
                    if ($path.hasClass("path")) {
                        $path.next().remove();
                    } else {
                        $path.prev().remove();
                    }
                    //Also add domainrow
                    domainRow = "<tr class='dummyDomain'>" + $path.siblings(".domain").html() + "</tr>";
                    //Show/hide paste accordingly
                    if (clipboard["link"] === "") {
                        $theadRow.find(".paste").hide();
                    }
                }
                theadRow = "<tr class='dummyHeader'>" + $theadRow.html() + "</tr>";
                var helpRows = theadRow + domainRow;

                //Code added to support accordion columns
                data = hideColumns($theadRow, data);

                $path.replaceWith(helpRows + data);
                $path.fadeIn(500);
                fillCombos();
                $(".types").each(function() {
                    var $this = $(this);
                    if ($this.children(".type").length === 1) {
                        $this.children(".type").find(".input-group-btn").css("visibility", "hidden");
                    }
                });
                $("body").css("opacity", "1");
                $(document.body).animate({//Scroll new editable block to top of page - 100px
                    'scrollTop': $('.dummyHeader').offset().top - 100

                }, 10);
            })
                    .fail(function() {
                        alert("Connection with server lost. Action failed!");
                        $("body").css("opacity", "1");
                    });
            viewOnly();
        }
    }
});
jQuery.fn.swapWith = function(to) {
    return this.each(function() {
        var copy_to = $(to).clone(true);
        var copy_from = $(this).clone(true);
        $(to).replaceWith(copy_from);
        $(this).replaceWith(copy_to);
    });
};

function hideColumns($header, data) {
    var $data = $("<tbody>" + data + "</tbody>"); //Added wrapper element tbody

    var dataType;
    if ($data.find("td").length === 6) {//Domain
        dataType = "domain";
    } else if ($data.find("td").length === 12) {//Link
        dataType = "link";
    }


    if ($header.find("th.sourceCol").length === 2) {
        $data.find("td.sourceCol").after("<td class='sourceCol'>&#160;</td>").hide();

    }
    if ($header.find("th.targetCol").length === 2) {
        $data.find("td.targetCol").after("<td class='targetCol'>&#160;</td>").hide();

    }
    if ($header.find("th.ifCol").length === 2) {
        $data.find("td.ifCol").after("<td class='ifCol'>&#160;</td>").hide();

    }
    if ($header.find("th.commentsHead").length === 2) {
        $data.find("td.commentsHead").after("<td class='commentsHead'>&#160;</td>").hide();
    }
    return $data.html();

}

function viewOnlySpecificPath(xpath) {

    $("#matching_table").find("tr[data-xpath='" + xpath + "']").each(function(index) {
        var $row = $(this);

        var url = "GetPart?id=" + id + "&xpath=" + $(this).attr("data-xpath") + "&mode=view";
        $.post(url).done(function(data) {
            var $data = $(data);
            highlightLink($data);
            $row.hide();
            $row.replaceWith($data);
            $row.fadeIn(500);
        }).fail(function() {
            alert("Connection with server lost. Action failed!");
        });
    });
}

function refreshTable() {
    var url = "GetPart?id=" + id + "&xpath=//mappings&mode=instance&generatorsStatus=" + generatorsStatus;
    $.post(url).done(function(data) {
        $(".mappings").html(data);

        if (generatorsStatus === "auto") {
            fillInstanceCombos();
        } else {
            fillInstanceCombos(".arg");
        }
        $("body").css("opacity", "1");
    })
            .fail(function() {
                alert("Connection with server lost. Action failed!");
                $("body").css("opacity", "1");
            });
}

function viewOnly() {
//Then make previously edited part viewable...
    $("#matching_table").find(".edit").each(function(index) {
        var $row = $(this);
        if (typeof $(this).attr("data-xpath") !== 'undefined') { //if path===undefined abort useless request


            var url = "GetPart?id=" + id + "&xpath=" + $(this).attr("data-xpath") + "&mode=view";
            $.post(url).done(function(data) {
                var $data = $(data);

                //Code added to support accordion columns
                var $head = $("thead").first().clone();//Changed because I do not need all theads!
                data = hideColumns($head, data);
                $data = $(data);

                highlightLink($data);
                $row.hide();
                $row.replaceWith($data);
                $row.fadeIn(500);

            }).fail(function() {
                alert("Connection with server lost. Action failed!");
            });
        }
    });

    //Also hide help rows
    $(".dummyHeader").remove();
    $(".dummyDomain").remove();
}
function highlightLink($data) {

    if (sourcePaths === "full") {
        $data.find(".sourcePath").each(function(index) {
            var $sourcePathSpan = $(this);
            findProperPathValue($sourcePathSpan);
        });
    }
    if (targetPaths === "full") {
        $data.find(".targetPath").each(function(index) {
            var $targetPathSpan = $(this);
            findProperPathValue($targetPathSpan);
        });
    }

    if ($data.hasClass("path")) {
        $data.css("border-top", "5px solid #29BCB5").css("border-left", "5px solid #29BCB5").css("border-right", "5px solid #29BCB5");
    } else {
        $data.css("border-bottom", "5px solid #29BCB5").css("border-left", "5px solid #29BCB5").css("border-right", "5px solid #29BCB5");
    }

    setTimeout(
            function() {
                if ($data.hasClass("path")) {
                    $data.css("border-top", "1px solid black").css("border-left", "1px solid black").css("border-right", "1px solid black");
                } else {
                    $data.css("border-bottom", "1px solid black").css("border-left", "1px solid black").css("border-right", "1px solid black");
                }
            }, 10000
            );
//    }
}

function refreshCombos(updatedXpath, self) {

    var pathFound = false;
    $('.edit').find('input.select2').each(function(index) { //Needs refining!
        var xpath = $(this).attr('data-xpath');
        if (updatedXpath === xpath) {
            pathFound = true;
            if (self) {
                fillCombo($(this), true);
            }
        } else {
            if (pathFound === true) {
                fillCombo($(this), false);
            }
        }
        console.log(updatedXpath + " vs " + xpath + " PATH FOUND:" + pathFound);
    });
}



function fillCombo($this, setValue) {

    var xpath = $this.attr('data-xpath');
    if (typeof $this.attr("data-xpath") !== 'undefined') {

        var url;
        if (xpath.indexOf("/source_relation") !== -1 || xpath.indexOf("/source_node") !== -1) {
            fillXMLSchemaCombo($this, "source");
        } else if (targetType === "xml") {
            fillXMLSchemaCombo($this, "target");
        } else {
            url = 'GetListValues?id=' + id + '&xpath=' + xpath + '&targetAnalyzer=' + comboAPI;
            $.ajax({
                url: url,
                dataType: 'json'
            }).success(function(data) {
                json = data;
                if (setValue) {
                    var oldValue = $this.val().trim();
                    var wrongValue = false;
                    if (JSON.stringify(json).indexOf('"' + oldValue + '"') === -1) {
                        wrongValue = true;
                    }
                    $this.select2({
                        allowClear: true,
                        placeholder: "Select a value",
                        data: json,
                        initSelection: function(element, callback) {
                            var data = {id: $this.attr("data-id"), text: $this.val()};
                            callback(data);
                        }
                    });

                    if (wrongValue) {
                        $this.parent().find(".select2-chosen").html("<span style='color:red;'>Value " + oldValue + " is no longer valid!</span>");
                    } else {
                        $this.select2('val', $this.val());
                    }

                } else {

                    var oldValue = $this.select2('val');
                    if (typeof oldValue === 'object') {
                        $this.select2({
                            allowClear: true,
                            placeholder: "Select a value",
                            data: json
                        });
                        oldValue = $this.parent().find(".select2-chosen").html();
                        if (JSON.stringify(json).indexOf('"' + oldValue + '"') === -1) {
                            if (oldValue.indexOf(":") !== -1) {
                                oldValue = oldValue.substring(oldValue.indexOf(':') + 1);
                            }
                            $this.parent().find(".select2-chosen").html("<span style='color:red;'>Value " + oldValue + " is no longer valid!</span>");
                        }
                        $("div[title='" + xpath + "']").first().remove();
                    } else {
                        $this.select2({
                            allowClear: true,
                            placeholder: "Select a value",
                            data: json
                        });

                        if ($this.parent().find(".select2-chosen").html() === "&nbsp;") {
                            $this.parent().find(".select2-chosen").html("<span style='color:red;'>Value " + oldValue.substring(oldValue.indexOf(':') + 1) + " is no longer valid!</span>");
                        }
                    }
                }
                $(".loader").hide();
            });
        }

    }

}

function fillInstanceCombos(selector) {
    var $selector;
    if (typeof selector === 'undefined') {
        $selector = $(".select2");
    } else {
        $selector = $(selector).find(".select2");
    }

    $selector.each(function() {

        var $this = $(this);



        var oldValue = $this.val().trim();
        var wrongValue = false;
        var data = instanceGeneratorsNames;
        if ($this.attr('title') === 'Argument type') {
            data = [{id: "", text: ""}, {id: "xpath", text: "xpath"}, {id: "xpathPosition", text: "xpathPosition"}, {id: "constant", text: 'constant'}, {id: "position", text: 'position'}]; //type values
        } else {
            if (JSON.stringify(instanceGeneratorsNames).indexOf('"' + oldValue + '"') === -1) {
                wrongValue = true;
            }
        }

        $this.select2({
            allowClear: true,
            placeholder: "Select a value",
            createSearchChoice: function(term, data) {
                if ($(data).filter(function() {
                    return this.text.localeCompare(term) === 0;
                }).length === 0) {
                    return {
                        id: term,
                        text: term
                    };
                }
            },
            data: data,
            initSelection: function(element, callback) {
                var data = {id: $this.attr("data-id"), text: $this.val()};
                callback(data);
            }
        });

        if (wrongValue) {
            $this.parent().find(".select2-chosen").html("<span style='color:red;'>Generator " + oldValue + " does not exist!</span>");
        } else {
            $this.select2('val', $this.val());
        }
        $this.next(".loader").hide();

    });

}


function fillXMLSchemaCombo($this, type) {

    if (type === "source") {
        if (sourceAnalyzerPaths.length === 0) {
            var url = '/xPaths/filePathService';
            var sourceAnalyzerFile = "";
            if (sourceAnalyzerFiles.indexOf("***") !== -1) { //Choose file to get xpaths from
                var files = sourceAnalyzerFiles.split("***");
                var schemaFile = files[0];
                var instanceFile = files[1];
                if (schemaFile.length > 0) {
                    sourceAnalyzerFile = schemaFile;
                } else {
                    if (instanceFile.length > 0) {
                        sourceAnalyzerFile = instanceFile;
                    }
                }
            }
            if (sourceAnalyzer === "on") {
                if (sourceAnalyzerFile.endsWith(".xsd")) {
                    sourceAnalyzerFile = "../xml_schema/" + sourceAnalyzerFile;
                }
                $.post(url, {fileName: sourceAnalyzerFile}, function(data) {
                    sourceAnalyzerPaths = data.results;
                    fillComboWithPaths($this, sourceAnalyzerPaths);
                },
                        "json").error(function(xhr) {
                    var error = JSON.parse(xhr.responseText).error;
                    alert("Error reading source schema or source xml: " + error + ".\nPlease disable Source Analyzer (Configuration tab) to fill in source values.");
                });
            }
        } else {
            fillComboWithPaths($this, sourceAnalyzerPaths);
        }
    } else {

        if (targetXPaths.length === 0) {
            var url = '/xPaths/filePathService';
            var targetFile = "";
            if (targetFiles.indexOf("***") !== -1) { //Choose file to get xpaths from
                var files = targetFiles.split("***");
                targetFile = files[0]; //get first XSD for now

            } else {
                targetFile = targetFiles;//get first XSD for now
            }
            if (targetFile.endsWith(".xsd")) {
                targetFile = "../xml_schema/" + targetFile;
            }
            $.post(url, {fileName: targetFile, root: targetRoot}, function(data) {
                targetXPaths = data.results;
                fillComboWithPaths($this, targetXPaths);
            },
                    "json").error(function(xhr) {
                var error = JSON.parse(xhr.responseText).error;
                alert("Error reading target schema or target xml: " + error + ".\nPlease set Target Analyzer (Configuration tab) to value 'None'");
            });
        } else {
            fillComboWithPaths($this, targetXPaths);
        }
    }

    $(".loader").hide();
}

function fillComboWithPaths($this, filteredPaths) {
    var xpath = $this.attr("data-xpath");

    if (!xpath.endsWith("domain/source_node") && xpath.indexOf("/target_") === -1) { //Apply filtering only for source link (path or range) combos
        filteredPaths = filterValues(xpath);
    } else if (targetType === "xml" && xpath.indexOf("domain/") === -1) {
        filteredPaths = filterValues(xpath);
    }
    $this.select2({
        allowClear: true,
        placeholder: "Select a value",
        createSearchChoice: function(term, data) {
            if ($(data).filter(function() {
                return this.text.localeCompare(term) === 0;
            }).length === 0) {
                return {
                    id: term,
                    text: term
                };
            }
        },
        data: filteredPaths,
        initSelection: function(element, callback) {
            var data = {id: $this.attr("data-id"), text: $this.val()};

            callback(data);
        }
    });

}

function getDomainValueForLink(xpath) {
    var domainPath = xpath.replace(/\/link[\s\S]*/g, "/domain");
    var $domain = $("tr[data-xpath='" + domainPath + "']");
    var domainValue;

    if (targetType === "xml" && xpath.indexOf("/target_") !== -1) {
        var $domainDiv = $domain.find(".targetPath").first();
        domainValue = $domainDiv.attr("data-fullpath");
        ;


    } else {
        var $domainDiv = $domain.find(".nextToIcon");

        domainValue = $domainDiv.html();
        if ($domainDiv.children("span").length > 0) {
            domainValue = $domainDiv.children("span").attr("title");
        }
    }
//    alert(domainValue)
    return domainValue;
}
function filterValues(xpath) {

    var domainValue = getDomainValueForLink(xpath);

    var paths;
    if (targetType === "xml" && xpath.indexOf("/target_") !== -1) {
        paths = targetXPaths;
    } else {
        paths = sourceAnalyzerPaths;
    }
    var filteredPaths;
    if (!domainValue.startsWith("/")) { //If xpath does not start with a "/", add it
        domainValue = "/" + domainValue;
        filteredPaths = $.map(paths, function(item) {
            var id = item.id;
            if (id.startsWith(domainValue + "/")) {
                var strippedItem = {id: item.id.substring(domainValue.length + 1), text: item.text.substring(domainValue.length + 1)};
                return strippedItem;
            }
        });
    } else if (domainValue.startsWith("//")) {//If xpath starts with a "//"
        domainValue = domainValue.substring(2);
        filteredPaths = $.map(paths, function(item) {
            var id = item.id;
            if (id.indexOf(domainValue + "/") !== -1) {
                var strippedItem = {id: item.id.substring(id.indexOf(domainValue + "/") + domainValue.length+1), text: item.text.substring(id.indexOf(domainValue + "/") + domainValue.length+1)};
                return strippedItem;
            }
        });
    } else {
        filteredPaths = $.map(paths, function(item) {//If xpath starts with a "/"
            var id = item.id;
            if (id.startsWith(domainValue + "/")) {
                var strippedItem = {id: item.id.substring(domainValue.length + 1), text: item.text.substring(domainValue.length + 1)};
                return strippedItem;
            }
        });
    }



    return filteredPaths;

}

function fillCombos() {
    $(".edit").find('.select2').each(function(index) {
        fillCombo($(this), true);
    });
}
function findProperPathValue($element) {
    var paths;
    if ($element.attr("class") === "sourcePath") {
        paths = sourcePaths;
    } else if ($element.attr("class") === "targetPath") {
        paths = targetPaths;
    }
    var value = $element.attr("data-" + paths + "Path");
    $element.html(value);
}

$("#targetAnalyzer input:radio").change(function() { //On change set variable
    comboAPI = $(this).val();
    viewOnly();
});
$("#sourceAnalyzer input:radio").change(function() { //On change set variable
    sourceAnalyzer = $(this).val();
    viewOnly();
});
$("#sourcePaths input:radio").change(function() { //On change set variable
    sourcePaths = $(this).val();
    viewOnly();
    $(".sourcePath").each(function(index) {
        var $sourcePathSpan = $(this);
        findProperPathValue($sourcePathSpan);
    });
});
$("#targetPaths input:radio").change(function() { //On change set variable
    targetPaths = $(this).val();
    viewOnly();
    $(".targetPath").each(function(index) {
        var $targetPathSpan = $(this);
        findProperPathValue($targetPathSpan);
    });
});


$("#generators input:radio").change(function() { //On change set variable
    $("body").css("opacity", "0.4");

    generatorsStatus = $(this).val();
    if (generatorsStatus === "auto" && instanceGeneratorsNames.length === 0) {
        getInstanceGeneratorNamesAndFillCombos();
    }
    refreshTable();
});



$('#info_edit-btn').click(function() {
    $("body").css("opacity", "0.4");
    var url = "GetPart?id=" + id + "&part=info&mode=edit";
    var $btn = $(this);
    $btn.button('loading');
    $.post(url).done(function(data) {
        $("#info>div").html(data);
        $btn.toggle();
        $btn.button('reset');
        $('#info_view-btn').toggle();

        $('.fileUpload').each(function() {
            var $this = $(this);
            upload($this);
        });
        if ($(".target_info").length === 1) { //Hide delete target if there only one!
            $(".targetInfoDeleteButton").hide();
        }
        if (targetType === "xml") {
            $("#addTarget").hide();
        }

        $("body").css("opacity", "1");
    }).fail(function() {
        alert("Connection with server lost. Action failed!");
        $("body").css("opacity", "1");
    });
});


$('#info_view-btn').click(function() {
    $("body").css("opacity", "0.4");
    var url = "GetPart?id=" + id + "&part=info&mode=view";
    var $btn = $(this);
    $btn.button('loading');
    $.post(url).done(function(data) {
        $("#info>div").html(data);
        $btn.toggle();
        $btn.button('reset');
        $('#info_edit-btn').toggle();
        $("body").css("opacity", "1");
    }).fail(function() {
        alert("Connection with server lost. Action failed!");
        $("body").css("opacity", "1");
    });
});
function upload($this) {

    var xpath = $this.attr("data-xpath");
    var uploadMessage = "Upload File";
    var allowedExtensions;
    if (xpath.endsWith("schema_file")) {
        uploadMessage = "Upload File";
        if (xpath.endsWith("source_schema/@schema_file")) {
            allowedExtensions = ['rdf', 'rdfs', 'xsd', 'xml'];
        } else {
            allowedExtensions = ['rdf', 'rdfs', 'xsd', 'xml'];
        }
    } else if (xpath.endsWith("xml_link") || xpath.endsWith("generator_link")) {
        uploadMessage = "Upload xml";
        allowedExtensions = ['xml'];

    } else if (xpath.endsWith("html_link")) {
        uploadMessage = "Upload html";
        allowedExtensions = ['html', 'htm'];

    } else if (xpath.endsWith("rdf_link")) {
        uploadMessage = "Upload rdf";
        allowedExtensions = ['rdf'];

//    }  else if (xpath.endsWith("generator_link")) {
//        uploadMessage = "Upload File";
    }
    var mappingId = id;
    $this.fineUploader({
        request: {
            endpoint: 'UploadReceiver?id=' + id + '&path=' + xpath + '&mode=' + comboAPI

        },
        multiple: false,
        validation: {
            allowedExtensions: allowedExtensions

        },
        text: {
            uploadButton: '<span class="glyphicon glyphicon-upload"></span> ' + uploadMessage
        },
        failedUploadTextDisplay: {
            mode: 'custom',
            maxChars: 40,
            responseProperty: 'error',
            enableTooltip: true
        },
        debug: false
    }).on('complete', function(event, id, fileName, responseJSON) {
        if (responseJSON.success) {
            filename = responseJSON.filename;


            var linkText = "view";
            var dataType = "";
            if (uploadMessage === "Upload rdf") {
                linkText = "view rdf";
            } else if (uploadMessage === "Upload xml") {

                sourceAnalyzer = "on";
                sourceAnalyzerFiles = sourceAnalyzerFiles.split("***")[0] + "***" + filename;
                sourceAnalyzerPaths = "";
                configurationOption("sourceAnalyzer", "enable");
                viewOnly();

                $("a:contains('Transformation')").attr("href", "#x3mlEngine").parent().removeClass("disabled").removeAttr("title");
                linkText = "view xml";
            } else if (uploadMessage === "Upload html") {
                linkText = "view html";

            } else { //Not sure if I want a default analyzer
                if (xpath.endsWith("source_schema/@schema_file")) {
                    sourceAnalyzer = "on";
                    sourceAnalyzerFiles = filename + "***" + sourceAnalyzerFiles.split("***")[1];
                    sourceAnalyzerPaths = "";
                    configurationOption("sourceAnalyzer", "enable");
                    viewOnly();
                } else {
                    dataType = "target_info"; //Added only for this case, may have to make use of it for other cases too.

                    if (comboAPI == 0) {
                        if (filename.endsWith(".xsd") || filename.endsWith(".xml")) {
                            if ($(".targetPath").first().html().length > 0) { //has specified root
                                comboAPI = 4;
                                configurationOption("targetAnalyzer", "enableXMLonly");
                            } else {
                                alert("XML Schema uploaded. Once you specify a root target xpath in domain column, XML target analyzer is enabled! (Configuration tab)")
                            }
                            targetType = "xml";
                            targetFiles = filename; //Atm only accept one xsd file!

                            $("#addTarget").hide();

                        } else {
                            targetType = "rdf"
                            comboAPI = 2;
                            configurationOption("targetAnalyzer", "enable");
                        }

                    }
                }
            }

            if (xpath.endsWith("generator_link")) {
                url = "FetchBinFile?id=" + mappingId + "&amp;type=generator_link&amp;file=" + encodeURIComponent(filename);
                linkText = "view generator xml";
            } else if (xpath.endsWith("rdf_link")) {
                url = "FetchBinFile?id=" + mappingId + "&amp;type=example_data_target_record&amp;file=" + encodeURIComponent(filename);
            } else {
                url = "FetchBinFile?id=" + mappingId + "&amp;file=" + encodeURIComponent(filename);
            }
            var linkHtml = "<a data-type='" + dataType + "' title='" + encodeURIComponent(filename) + "' style='position:relative;top:1px;' target='_blank' href='" + url + "'>" + linkText + " </a>";
            var deleteHtml = " <button class='btn btn-default btn-link btn-sm deleteFile' type='button' title='Delete " + encodeURIComponent(filename) + "' id='delete***" + xpath + "'>" +
                    "<span class='glyphicon glyphicon-remove'></span>" +
                    "</button> ";
            var $html = $("<div>" + linkHtml + deleteHtml + "</div>");
            $this.next().css('display', 'inline');
            $this.before($html);
            $this.toggle("slow");
        }
    });
}
