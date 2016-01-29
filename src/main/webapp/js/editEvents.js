/*
 * Copyright 2014-2016 Institute of Computer Science,
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

/*
 * --------------------------------- GLOBAL ----------------------------------
 */

/*
 * Handler fired when input field loses focus to update xml values
 */
$("body").on("blur", ".form-control", function() {

    var $input = $(this);

    if (typeof $input.attr("data-xpath") === 'undefined') { //Skip

    } else {
        var url = "Update?id=" + id + "&xpath=" + $input.attr("data-xpath") + "&value=" + encodeURIComponent($input.val());

        if (targetType === "xml" && $input.attr("data-xpath") === "//x3ml/mappings/mapping[1]/domain/target_node/entity[1]/type[1]") {
            if ($input.val().length > 0) {
                comboAPI = 4;
                configurationOption("targetAnalyzer", "enableXMLonly");
            } else {
                comboAPI = 0;
                configurationOption("targetAnalyzer", "disable");
            }
            targetRoot = $input.val();

        }

        $.post(url)
                .done(function(data) {
                    $input.attr("value", data);
                })
                .fail(function() {
                    alert("Connection with server lost. Update failed! Value remains:" + $input.attr("value"))
                    $input.val($input.attr("value"));
                });
    }
});


/*
 * Handler fired when user changes selection in select2 box
 */
$("#matching_table").on("change", ".select2", function(e) {
    var $input = $(this);
    var xpath = $input.attr('data-xpath');
    goAhead = true;

    if (xpath.indexOf("instance_generator/@name") !== -1 || (xpath.indexOf("label_generator[") !== -1 && xpath.endsWith("/@name"))) {
        confirmDialog("GeneratorName");
    }
    if (goAhead) {

        var url = "Update?id=" + id + "&xpath=" + $input.attr("data-xpath") + "&value=" + encodeURIComponent(e.val) + "&targetType=" + targetType;
        $.post(url).done(function(data) {

            $input.val(data);
            $input.attr("data-id", e.val);
//            var xpath = $input.attr('data-xpath');

            if (xpath.indexOf("/source_relation") === -1 && xpath.indexOf("/source_node") === -1 && targetType !== "xml") {
                refreshCombos(xpath, true);
            } else {
                $input.select2("val", data); //set chosen value
            }
            if (xpath.indexOf("instance_generator/@name") !== -1 || (xpath.indexOf("label_generator[") !== -1 && xpath.endsWith("/@name"))) {
                $input.parent().parent().parent().find('button[title="Add Arguments"]').trigger("click");
            }

        });
    } else {

        $input.val(e.removed.id);
        $input.attr("data-id", e.removed.id);
        $input.parent().find(".select2-chosen").html(e.removed.id);
    }
});


/*
 * Handler fired when user enters mouse over delete icon
 */
$("body").on("mouseenter", ".close,.closeOnHeader", function() {
    var id = $(this).attr("id");
    var vars = id.split("***");
    if (vars.length > 0) {
        var xpath = vars[1];
        if (xpath.endsWith("/..")) {
            xpath = xpath.substring(0, xpath.length - 3);
            if (xpath.endsWith("domain")) {
                xpath = xpath.substring(0, xpath.length - 7);
                $("tbody[id='" + xpath + "']").children(".path,.edit,.domain,.range").css("border", "2px dashed #6D98D0");
            } else {

                $("*[id='" + xpath + "']").css("border-top", "2px dashed #6D98D0").css("border-left", "2px dashed #6D98D0").css("border-right", "2px dashed #6D98D0");
                $("*[id='" + xpath + "']").next().css("border-bottom", "2px dashed #6D98D0").css("border-left", "2px dashed #6D98D0").css("border-right", "2px dashed #6D98D0");
            }

        } else {
            $("*[id='" + xpath + "']").css("border", "2px dashed #6D98D0");
        }

    }

});
/*
 * Handler fired when user leaves mouse from delete icon
 */
$("body").on("mouseleave", ".close,.closeOnHeader", function() {
    var id = $(this).attr("id");
    var vars = id.split("***");
    if (vars.length > 0) {
        var xpath = vars[1];
        if (xpath.endsWith("/..")) {
            xpath = xpath.substring(0, xpath.length - 3);

            if (xpath.endsWith("domain")) {
                xpath = xpath.substring(0, xpath.length - 7);
                $("tbody[id='" + xpath + "']").children(".path,.edit,.domain,.range").css("border", "");
            } else {
                $("*[id='" + xpath + "']").css("border", "");
                $("*[id='" + xpath + "']").next().css("border", "");
            }
        } else {
            $("*[id='" + xpath + "']").css("border", "");
        }

    }


});

/*
 * Handler fired when user clicks to copy
 */
$("body").on("click", ".copy", function() {

    var btnId = $(this).attr("id");
    var vars = btnId.split("***");

    if (vars.length > 0) {
        var xpath = vars[1];

        if (xpath.endsWith("path/..")) {
            clipboard["link"] = xpath;
        } else {
            clipboard["mapping"] = xpath;
        }
        $(".paste").show();




    }


});

/*
 * Handler fired when user clicks to paste
 */
$("body").on("click", ".paste", function() {

    var btnId = $(this).attr("id");
    var vars = btnId.split("***");
    var action = "paste";

    if (vars.length > 0) {
        var xpath = vars[1];
        var copyMode, clipBoardValue, copiedPath, pasteAfterPath;
        if (xpath.endsWith("path/..")) { //Copied Link
            copyMode = "link";
            clipBoardValue = clipboard['link'];
            copiedPath = clipBoardValue.replaceAll("/path/..", "");
            pasteAfterPath = xpath.replaceAll("/path/..", "");
        } else {
            copyMode = "mapping";
            clipBoardValue = clipboard['mapping'];
            copiedPath = clipBoardValue.replaceAll("/domain/..", "");
            pasteAfterPath = xpath.replaceAll("/domain/..", "");
        }


        var url = "Action?id=" + id + "&xpath=" + clipBoardValue + "***" + xpath + "&action=" + action;
        var $newPath, $newRange, $newMapping, $newAddition, $addAfterPlace, $selector;
        var mode, newPath;

        var $container = $("<container></container>"); //used link but Chrome had an issue with it...
        var copyPos = parseInt(getPosition(copiedPath));
        var pastePos = parseInt(getPosition(pasteAfterPath));
        var newPos = pastePos + 1;

        if (copyMode === "mapping") {
            $newMapping = $("tbody[data-xpath='" + copiedPath + "']").clone();
            if (copiedPath === pasteAfterPath) { //Cloning!
                mode = "cloning";
            } else {
                mode = "pasting";
            }
            $newAddition = $container.append($newMapping);
            newPath = pasteAfterPath.replaceAll("/mappings/mapping[" + copyPos + "]", "/mappings/mapping[" + newPos + "]");
            $addAfterPlace = $("tbody[data-xpath='" + pasteAfterPath + "']");
            $selector = $addAfterPlace.nextAll("tbody");

        } else {

            if (copiedPath === pasteAfterPath) { //Cloning!
                mode = "cloning";
                $newPath = $("tr[data-xpath='" + copiedPath + "/path']").clone();
                $newRange = $("tr[data-xpath='" + copiedPath + "/range']").clone();

            } else {
                mode = "pasting";
                $newPath = $("tr[data-xpath='" + copiedPath + "']").first().clone();
                $newRange = $("tr[data-xpath='" + copiedPath + "']").last().clone();
            }

            $newAddition = $container.append($newPath).append($newRange);
            newPath = pasteAfterPath.replaceAll("]/link[" + copyPos + "]", "]/link[" + newPos + "]");
            $addAfterPlace = $("tr[data-xpath='" + pasteAfterPath + "/range']");
            $selector = $addAfterPlace.nextUntil("tr.empty");


        }


        var newAdditionHtml = $newAddition.html();
        newAdditionHtml = newAdditionHtml.replaceAll(copiedPath, newPath);

        $.post(url).done(function(data) {

            //Change positions for elements after the inserted one
            $selector.each(function() { //TODO create a function since this code is used repeatedly...
                var currentXpath = $(this).attr("data-xpath");
                var nextXpath = getNextPath(currentXpath);

                if (clipBoardValue.indexOf(currentXpath) !== -1) {
                    clipboard[copyMode] = nextXpath; //Update clipboard value!
                }

                var currentHtml = $(this).html();
                $(this).attr("id", nextXpath);
                $(this).attr("data-xpath", nextXpath);

                var newHtml = currentHtml.replaceAll(currentXpath, nextXpath);
                $(this).html(newHtml);
            });


//            //Client side       
            if (mode === "pasting") {
                var $newAdditionHtml = $("<div></div>").append(newAdditionHtml);
                $newAdditionHtml.find("tr").each(function() {
                    highlightLink($(this)); //Known issue: This highlight does not vanish, as it should...
                });
                $addAfterPlace.after($newAdditionHtml.html());
            } else {
                $addAfterPlace.after(newAdditionHtml);
            }
            if (mode === "cloning") {
                if (copyMode === "mapping") {
                    viewOnlySpecificPath(newPath + "/domain");
                    $("#matching_table").find("tr[data-xpath='" + newPath + "/domain" + "']").prev().remove();
                    $("#matching_table").find("tr[data-xpath='" + newPath + "/domain" + "']").prev().remove();

                } else {
                    viewOnlySpecificPath(newPath + "/path");
                    viewOnlySpecificPath(newPath + "/range");
                }
            }


        });




    }
});

/*
 * Handler fired when user adds XML elements
 */
$("body").on("click", ".add", function(e) {
    e.preventDefault();
    var $btn = $(this);
    var btnId = $btn.attr("id");


    if (btnId === "addTarget") {
        //Server side
        action = "addAfter";
        xpath = "//x3ml/info/target_info[last()]";
        xsl = "info.xsl";
        var sibs = $(".target_info").length;

        var url = "Add?id=" + id + "&xpath=" + xpath + "&action=" + action + "&xsl=" + xsl + "&sibs=" + sibs;

        $.post(url).done(function(data) {
            //Client side        
            $(".target_info").last().after(data);
            $(".target_info").last().find('.fileUpload').each(function() {
                var $this = $(this);
                upload($this);
            });
        });
        //Server side
        action = "add";
        xpath = "//x3ml/namespaces/namespace";
        var url = "Add?id=" + id + "&xpath=" + xpath + "&action=" + action;

        $.post(url).done(function(data) {

        });
    } else if (btnId.indexOf("/domain") === -1 && btnId.indexOf("/link") === -1) { //If no link and no domain -> Has to be mapping
        var vars = btnId.split("***");
        var xpath = vars[1];
        var $addPlace = $("tbody[id='" + xpath + "']");

        //Server side 
        action = "addAfter";
        xsl = "mapping.xsl";

        var url = "Add?id=" + id + "&xpath=" + xpath + "&action=" + action + "&xsl=" + xsl + "&targetAnalyzer=" + comboAPI + "&sourceAnalyzer=" + sourceAnalyzer;
        $.post(url).done(function(data) {

            $addPlace.nextAll("tbody").each(function() {
                var currentXpath = $(this).attr("data-xpath");
                var currentHtml = $(this).html();
                var nextXpath = getNextPath(currentXpath);

                if (clipBoardValue.indexOf(currentXpath) !== -1) {
                    clipboard["mapping"] = nextXpath; //Update clipboard value!
                }

                $(this).attr("id", nextXpath);
                $(this).attr("data-xpath", nextXpath);

                var newHtml = currentHtml.replaceAll(currentXpath, nextXpath);
                $(this).html(newHtml);
            });


            viewOnly();
            $addPlace.after(data);
            //Client side  
            fillCombos();

        });
    } else if (btnId.endsWith("/type")) { //Adding entity type
        var vars = btnId.split("***");
        var xpath = vars[1];

        var $bucket = $("div[data-xpath='" + xpath + "']");
        var sibs = $bucket.children().length;

        xpath = xpath + "[last()]";

        if (btnId.indexOf("target_relation") !== -1) { //entity (optional) type in intermediate 
            action = "addOptional___" + xpath;
        } else {
            action = "addAfter";
        }
        xsl = "type.xsl";


        var url = "Add?id=" + id + "&xpath=" + xpath + "&action=" + action + "&xsl=" + xsl + "&sibs=" + sibs + "&targetAnalyzer=" + comboAPI;
        $.post(url).done(function(data) {
            //Client side  
            $bucket.children().last().after(data);
            fillCombo($bucket.children().last().find('input.select2'), true);


            $bucket.children().find(".input-group-btn").each(function() {
                $(this).css("visibility", "visible");

            });


        });

    } else if (btnId.endsWith("/additional")) { //Adding additional
        var vars = btnId.split("***");
        var xpath = vars[1];
        var $bucket = $("div[data-xpath='" + xpath + "']");
        var sibs = $bucket.children().length;

        xpath = xpath + "[last()]";
        action = "addOptional___" + xpath;
        xsl = "additional.xsl";


        var url = "Add?id=" + id + "&xpath=" + xpath + "&action=" + action + "&xsl=" + xsl + "&sibs=" + sibs + "&targetAnalyzer=" + comboAPI;
        $.post(url).done(function(data) {
//            //Client side  

            if (sibs > 0) {
                $bucket.children().last().after(data);
            } else {
                $bucket.html(data);
            }
            fillCombo($bucket.children().last().find('input.select2'), true);
            $bucket.parent().addClass("left-bordered");


        });
    } else if (btnId.endsWith("/instance_generator") || btnId.endsWith("/label_generator")) { //Adding instance_generator or label_generator
        var generatorType;
        if (btnId.endsWith("/instance_generator")) {
            generatorType = "instance";
        } else {
            generatorType = "label";
        }

        var vars = btnId.split("***");
        var xpath = vars[1];
        var $bucket = $("div[id='" + xpath.replaceAll("/" + generatorType + "_generator", "/generators") + "']");

        if (generatorType === "instance") {
            var sibs = 0;
        } else {
            var sibs = $bucket.children(".label_generator").length;
            xpath = xpath + "[last()]";
        }
        action = "addOptional___" + xpath;
        xsl = generatorType + "_generator.xsl";


        var url = "Add?id=" + id + "&xpath=" + xpath + "&action=" + action + "&xsl=" + xsl + "&sibs=" + sibs + "&targetAnalyzer=" + comboAPI + "&generatorsStatus=" + generatorsStatus;
        $.post(url).done(function(data) {
            //Client side  


            if ($bucket.children().length === 0) { //No generator
                $bucket.html(data);
            } else {
                if (generatorType === "instance") {
                    $bucket.prepend(data);
                } else {
                    $bucket.append(data);
                }
            }
            if (generatorType === "instance") {
                $bucket.next("button[id='add***" + xpath + "']").hide(); //Hide add instance generator link
                if (generatorsStatus === "auto") {
                    fillInstanceCombos(".instance_generator");
                }
            } else {
                if (generatorsStatus === "auto") {
                    fillInstanceCombos(".label_generator");
                }
            }
        });

    } else if (btnId.endsWith("/arg")) { //Adding instance_generator

        var vars = btnId.split("***");
        var xpath = vars[1];
        var $bucket = $("div[id='" + xpath.replaceAll("/arg", "/args") + "']");

        var sibs = $bucket.children().length;

        xsl = "arg.xsl";
        var url;
        if ($btn.attr('title') === 'Add Arguments') {
            action = "addArgs___" + xpath;
            xpath = xpath.replaceAll("/arg", "");
            url = "Add?id=" + id + "&xpath=" + xpath + "&action=" + action + "&xsl=" + xsl + "&sibs=" + sibs + "&generatorsStatus=" + generatorsStatus;

        } else {
            xpath = xpath + "[last()]"; //Multiple elements need that!
            action = "addOptional___" + xpath;
            url = "Add?id=" + id + "&xpath=" + xpath + "&action=" + action + "&xsl=" + xsl + "&sibs=" + sibs + "&targetAnalyzer=" + comboAPI;

        }


        $.post(url).done(function(data) {
            if ($btn.attr('title') === 'Add Arguments') {
//                $btn.hide(); //not needed any more
                var $data = $(data).find(".args");
                data = $data.html();
                $bucket.html(data);
            } else {
                //Client side  
                if ($bucket.children().length === 0) { //No label generator
                    $bucket.html(data);
                } else {
                    $bucket.append(data);
                }

            }
            fillInstanceCombos(".arg");
        });

    } else if (btnId.endsWith("/intermediate")) { //Adding intermediate
        var vars = btnId.split("***");
        var xpath = vars[1];
        var $bucket = $("div[data-xpath='" + xpath + "']");
        var sibs = $bucket.children().length;

        xpath = xpath + "[last()]";
        action = "addOptional___" + xpath;

        xsl = "intermediate.xsl";

        var url = "Add?id=" + id + "&xpath=" + xpath + "&action=" + action + "&xsl=" + xsl + "&sibs=" + sibs + "&targetAnalyzer=" + comboAPI + "&sourceAnalyzer=" + sourceAnalyzer;

        $.post(url).done(function(data) {
//            //Client side  

            if (sibs > 0) {
                $bucket.children().last().after(data);
            } else {
                $bucket.html(data);
            }

            $bucket.children().last().find(".delete:first").parent().css("visibility", "hidden"); //Hide remove type
            fillCombo($bucket.children().last().find('input.select2'), true);


        });


    } else if (btnId.endsWith("/comments")) {
        var vars = btnId.split("***");
        var xpath = vars[2];
        var commentChild = vars[1];

        var $commentPart = $("div.form-group[id='" + xpath + "/comment[1]/" + commentChild + "']");
        if (typeof $commentPart.html() === 'undefined') { //If comments do not exist, add them!





            var $bucket = $("div[id='" + xpath + "']"); //div button group
            //Server side [id='" + xpath + "']
            action = "addOptional___" + xpath;
            xsl = "comments.xsl";



            var url = "Add?id=" + id + "&xpath=" + xpath + "&action=" + action + "&xsl=" + xsl;
            $.post(url).done(function(data) {
////            //Client side       

                $bucket.html(data);
                $("div.form-group[id='" + xpath + "/comment[1]/" + commentChild + "']").show();
            });

        } else { //If comments exist, avoid unnecessary request and just show hidden field            



        }
        $commentPart.show();


        $(this).parent().addClass("disabled"); //Make option disabled


    } else if (btnId.endsWith("quality") || btnId.endsWith("xistence") || btnId.endsWith("Narrowness")) {
        var vars = btnId.split("***");
        var xpath = vars[1];
        var ruleType = vars[2];
        var sibs = $("div.rule[data-xpath^='" + xpath + "/if" + "']").length; //Get links with data-xpath starting with same same value


        var fullPath = xpath + "/" + ruleType;


        var $bucket = $btn.parent().parent();


        //Server side [id='" + xpath + "']
        action = "addOptional___" + fullPath;
        xsl = "if-rule.xsl";

        var url = "Add?id=" + id + "&xpath=" + xpath + "&action=" + action + "&xsl=" + xsl + "&sibs=" + sibs;

        $.post(url).done(function(data) {
//            //Client side     
            var $rulesDiv = $btn.parentsUntil(".rules").parent();
            $rulesDiv.children(".rule,.text-center").remove();
            $btn.parent().parent().parent().before(data);

        });



    } else if (btnId.endsWith("/link")) {
        var vars = btnId.split("***");
        var xpath = vars[1];


        //Server side [id='" + xpath + "']
        action = "add";
        xsl = "link.xsl";
        var sibs = $("tr[data-xpath^='" + xpath + "']").length; //Get links with data-xpath starting with same value
        sibs = parseInt(sibs) / 2; //Because path and range have common data-xpath
//
        var url = "Add?id=" + id + "&xpath=" + xpath + "&action=" + action + "&xsl=" + xsl + "&sibs=" + sibs + "&targetAnalyzer=" + comboAPI + "&sourceAnalyzer=" + sourceAnalyzer;

        $.post(url).done(function(data) {
            //Client side       
            viewOnly();

            if (sibs === 0) { //First link
                xpath = xpath.replaceAll("/link", "/domain");
                $("tr[data-xpath='" + xpath + "']").after(data);
            } else { //Add after last 
                $("tr[data-xpath^='" + xpath + "']").last().after(data);
            }
            fillCombos();
        });

    } else { //Toggle drop-down button with links (Inside entity)
        var vars = btnId.split("***");
        var xpath = vars[1];

        if (xpath.endsWith("@variable")) { //@variable
            //Server side
            action = "addAttr";
            var url = "Add?id=" + id + "&xpath=" + xpath + "&action=" + action;

            $.post(url).done(function(data) {
            });
        } else {
            if (xpath.indexOf("/instance_info") !== -1) { //Language-Constant-Description
                //Server side
                action = "addOptional___" + xpath;

                var url = "Add?id=" + id + "&xpath=" + xpath + "&action=" + action;
                $.post(url).done(function(data) {
                });
            }
        }

        if (xpath.endsWith("@variable") || xpath.indexOf("/instance_info") !== -1) {
            // HTML code        
            $(this).parent().addClass("disabled");
            $("*[id='" + xpath + "']").parent().parent().css("display", "block");
        }

    }

});


/*
 * Handler fired when user clicks to delete XML+HTML
 */
$("body").on("click", ".close,.closeOnHeader", function() {

    confirmDialog();
    if (goAhead) {

        var $btn = $(this);
        var btnId = $btn.attr("id");
        var vars = btnId.split("***");


        if (vars.length > 0) {
            var xpath = vars[1];
            var selector;
            if (xpath.endsWith("/..")) {
                var xpathWithoutDots = xpath.substring(0, xpath.length - 3);
                if (xpathWithoutDots.endsWith("domain")) { //Deleting mapping
                    xpathWithoutDots = xpathWithoutDots.substring(0, xpathWithoutDots.length - 7);
                    var $blockToRemove = $("tbody[id='" + xpathWithoutDots + "']");
                    selector = "tbody";

                    if (clipboard["mapping"] === xpath) {
                        clipboard["mapping"] = "";
                    }

                } else { //Deleting link (path+range)

                    var $blockToRemove = $("*[id='" + xpathWithoutDots + "']").next().addBack();
                    selector = ".path, .range";

                    if (clipboard["link"] === xpath) {
                        clipboard["link"] = "";
                    }
                }

            } else {
                var $blockToRemove = $("*[id='" + vars[1] + "']");
                var xpath = $blockToRemove.attr("data-xpath");
                selector = "." + $blockToRemove.attr("class");

            }
            var url = "Delete?id=" + id + "&xpath=" + xpath + '&targetAnalyzer=' + comboAPI;
            $.post(url).done(function(data) {

                if (xpath.endsWith("/equals") || xpath.endsWith("/exists") || xpath.endsWith("/narrower")) { //Special treatment
                    var $rulesDiv = $btn.parentsUntil(".rules").parent();
                    $rulesDiv.children(".rule,.text-center").remove();
                    $rulesDiv.prepend(data);
                } else {


                    $blockToRemove.nextAll(selector).each(function() {
//                        if ((selector === "tbody") || selector === ".path, .range") { //Testing only for maps and links at first to fix issue 30
                        $btn = $(this); //DANGER! It makes sense but I wonder if it works for all cases (tested with maps-links-args-generators)
//                        }

                        var currentXpath = $btn.attr("data-xpath");
//                        var currentXpath = $btn.attr("id");


                        var currentHtml = $btn.html();


                        var newPath = getPreviousPath(currentXpath);

                        if (selector === "tbody") { //mapping
                            if (clipboard["mapping"].indexOf(currentXpath) !== -1) {
                                clipboard["mapping"] = newPath; //Update clipboard value!
                            }


                        } else if (selector === ".path, .range") { //link

                            if (clipboard["link"].indexOf(currentXpath) !== -1) {
                                clipboard["link"] = newPath; //Update clipboard value!
                            }

                        }

                        $btn.attr("id", newPath);
                        $btn.attr("data-xpath", newPath);


                        var newHtml = currentHtml.replaceAll(currentXpath, newPath);
                        if (newPath.indexOf("/intermediate") !== -1) { //Intermediate faux element has to be replaced
                            var currentPos = parseInt(getPosition(currentXpath));

                            if (newPath.indexOf("/source_relation") !== -1) {
                                var relationPos = currentPos + 1;
                                var newPos = currentPos - 1;

                                newHtml = newHtml.replaceAll("/source_relation/node[" + currentPos + "]", "/source_relation/node[" + newPos + "]");
                                newHtml = newHtml.replaceAll("/source_relation/relation[" + relationPos + "]", "/source_relation/relation[" + currentPos + "]");

                            } else {
                                var relationshipPos = currentPos + 1;
                                var newPos = currentPos - 1;

                                newHtml = newHtml.replaceAll("/target_relation/entity[" + currentPos + "]", "/target_relation/entity[" + newPos + "]");
                                newHtml = newHtml.replaceAll("/target_relation/relationship[" + relationshipPos + "]", "/target_relation/relationship[" + currentPos + "]");
                            }


                        }
                        $btn.html(newHtml);

                    });

                    if (selector === ".comments") {
                        $blockToRemove.children().fadeOut("slow").remove();

                        $blockToRemove.next("div.btn-group").find("li").removeClass("disabled");

                    } else {
                        if (selector === ".target_info") {
                            if ($(".target_info").length === 2) {
                                $(".targetInfoDeleteButton").hide();
                            }
                        }
                        if (selector === "tbody") {
                            $blockToRemove.prev("thead").fadeOut("slow").remove();
                        }


                        $blockToRemove.fadeOut("slow").remove();
                    }

                    if (selector === "tbody" || selector === ".path, .range") {
                        //Also hide help rows
                        $(".dummyHeader").remove();
                        $(".dummyDomain").remove();
                    }
                    if (selector === ".instance_generator") {
                        //Show add link button again
                        $("button[id='add***" + xpath + "']").show();
                    }

                    if (selector === ".intermediate") {
//                    alert(xpath);
                        xpath = xpath.replace(/\/intermediate\[\d+\]/g, "/relationship[1]"); //Could not make replaceAll work, so used replace instead
                        refreshCombos(xpath, false);

                    }
                }


            });
        }
    }

});

/*
 * Handler fired when user saves raw XML
 */
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



/*
 * --------------------------------- MATCHING TABLE TAB ----------------------------------
 */

/*
 * Handler fired when user changes operator (OR-AND) in if-rules column
 */
$("#matching_table").on("change", ".operator input:radio", function(e) {
    var $operator = $(this);
    var xpath = $operator.parent().parent().attr("id");
    var value = $operator.val();
    var url = "Update?id=" + id + "&xpath=" + xpath + "&action=operator" + "&value=" + value;
    $.post(url).done(function(data) {
        var $rulesDiv = $operator.parentsUntil(".rules").parent();
        $rulesDiv.children(".rule,.text-center").remove();
        $rulesDiv.prepend(data);
    });

});

/*
 * Handler fired when user adds Rule in if-rules column
 */
$("#matching_table").on("click", "#addRuleButton", function(e) {
    var $btn = $(this);
    var rulesCount = $btn.parent().parent().children(".rule").length;
    if (rulesCount === 0) {

        $btn.next().children().slice(0, 8).hide();
    } else {
        $btn.next().children().slice(0, 8).show();

    }
});


/*
 * Handler fired when user enters mouse over a path
 */
$("body").on("mouseenter", ".path", function() {
    $(this).css("border-top", "2px solid black").css("border-left", "2px solid black")
            .css("border-right", "2px solid black");
    $(this).next().css("border-bottom", "2px solid black").css("border-left", "2px solid black").css("border-right", "2px solid black");

});

/*
 * Handler fired when user leaves mouse from a path
 */
$("body").on("mouseleave", ".path", function() {
    $(this).css("border-top", "1px solid black").css("border-left", "1px solid black").css("border-right", "1px solid black");
    $(this).next().css("border-bottom", "1px solid black").css("border-left", "1px solid black").css("border-right", "1px solid black");

});
/*
 * Handler fired when user enters mouse over a range
 */
$("body").on("mouseenter", ".range", function() {
    $(this).prev().css("border-top", "2px solid black").css("border-left", "2px solid black").css("border-right", "2px solid black");
    $(this).css("border-bottom", "2px solid black").css("border-left", "2px solid black").css("border-right", "2px solid black");

});
/*
 * Handler fired when user leaves mouse from a range
 */
$("body").on("mouseleave", ".range", function() {
    $(this).prev().css("border-top", "1px solid black").css("border-left", "1px solid black").css("border-right", "1px solid black");
    $(this).css("border-bottom", "1px solid black").css("border-left", "1px solid black").css("border-right", "1px solid black");

});


/*
 * Handler fired when user clicks to delete XML element but just hide HTML block (e.g. instance_info)
 */
$("body").on("click", ".toggle", function() {
    var xpath = $(this).parent().parent().children(".form-control").attr("data-xpath");

    $(this).parent().parent().parent().css("display", "none");

    var url = "Delete?id=" + id + "&xpath=" + xpath;
    $.post(url).done(function(data) {
        var $linkToEnable = $("*[id='add***" + xpath + "']");
        $linkToEnable.parent().removeClass("disabled");
    });
});

/*
 * Handler fired when user clicks to delete entity
 */
$("body").on("click", ".delete", function() {

    var btnId = $(this).attr("id");
    var vars = btnId.split("***");

    if (vars.length > 0) {
        var xpath = vars[1];
        var $blockToRemove = $("*[id='" + vars[1] + "']").parent().parent(); //to remove entire row

        var selector = "." + $blockToRemove.attr("class");
        var url = "Delete?id=" + id + "&xpath=" + xpath;
        $.post(url).done(function(data) {

            $blockToRemove.nextAll(selector).each(function() {
                var currentXpath = $(this).find("input").last().attr("data-xpath");

                var currentHtml = $(this).html();
                $(this).find("input").last().attr("id", getPreviousPath(currentXpath));
                $(this).find("input").last().attr("data-xpath", getPreviousPath(currentXpath));

                var newHtml = currentHtml.replaceAll(currentXpath, getPreviousPath(currentXpath));
                $(this).html(newHtml);
            });




            if (selector.endsWith("type")) {
                if ($blockToRemove.siblings().find(".input-group-btn").length === 1) {
                    $blockToRemove.siblings().find(".input-group-btn").css("visibility", "hidden");

                }
            }

            $blockToRemove.fadeOut("slow").remove();

        });


    }
});

/*
 * Handler fired when user clicks matching table row to edit
 */
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
/*
 * --------------------------------- INFO TAB ----------------------------------
 */

/*
 * Handler fired when user clicks to view info 
 */
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
/*
 * Handler fired when user clicks to edit info 
 */
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

/*
 * Handler fired when user clicks to delete external file
 */
$("body").on("click", ".deleteFile", function() {
    var btnId = $(this).attr("id");
    var vars = btnId.split("***");
    var $actionDiv = $(this).parent();

    if (vars.length > 0) {
        var xpath = vars[1];

        var url = "Delete?id=" + id + "&xpath=" + xpath + '&targetAnalyzer=' + comboAPI;



        $.post(url).done(function(data) {
            $actionDiv.toggle("slow");
            if ($actionDiv.hasClass()) {
                var className = $actionDiv.attr("class");
                $actionDiv.next("." + className).toggle("slow");
            } else {
                $actionDiv.next().toggle("slow");
            }

            if (xpath.endsWith("source_schema/@schema_file")) {

                sourceAnalyzerFiles = "***" + sourceAnalyzerFiles.split("***")[1];
                if (sourceAnalyzerFiles === "***") {
                    sourceAnalyzer = "off";
                    configurationOption("sourceAnalyzer", "disable");
                } else {
                    sourceAnalyzer = "on";
                }
                sourceAnalyzerPaths = "";
                viewOnly();
            } else if (xpath.endsWith("example_data_source_record/@xml_link")) {
                sourceAnalyzerFiles = sourceAnalyzerFiles.split("***")[0] + "***";
                if (sourceAnalyzerFiles === "***") {
                    sourceAnalyzer = "off";
                    configurationOption("sourceAnalyzer", "disable");
                } else {
                    sourceAnalyzer = "on";
                }
                sourceAnalyzerPaths = "";

                $("a:contains('Transformation')").attr("href", "#").parent().addClass("disabled").attr("title", "Add a source record xml file to enable this tab!");
                viewOnly();
            } else if (xpath.endsWith("target_schema/@schema_file")) {

                if ($("a[data-type='target_info']:visible").length === 1) { //Deleting last target schema file
                    configurationOption("targetAnalyzer", "disable");
                    comboAPI = 0;
                    $("#addTarget").show();

                }
            }




        });

    }
});


/*
 * --------------------------------- CONFIGURATION TAB ----------------------------------
 */

/*
 * Handler fired when user changes target Analyzer option
 */
$("#targetAnalyzer input:radio").change(function() {
    comboAPI = $(this).val();
    viewOnly();
});
/*
 * Handler fired when user changes source Analyzer option
 */
$("#sourceAnalyzer input:radio").change(function() {
    sourceAnalyzer = $(this).val();
    viewOnly();
});
/*
 * Handler fired when user changes source paths option
 */
$("#sourcePaths input:radio").change(function() {
    sourcePaths = $(this).val();
    viewOnly();
    $(".sourcePath").each(function(index) {
        var $sourcePathSpan = $(this);
        findProperPathValue($sourcePathSpan);
    });
});
/*
 * Handler fired when user changes target paths option
 */
$("#targetPaths input:radio").change(function() {
    targetPaths = $(this).val();
    viewOnly();
    $(".targetPath").each(function(index) {
        var $targetPathSpan = $(this);
        findProperPathValue($targetPathSpan);
    });
});

/*
 * Handler fired when user changes generators option
 */
$("#generators input:radio").change(function() {
    $("body").css("opacity", "0.4");

    generatorsStatus = $(this).val();
    if (generatorsStatus === "auto" && instanceGeneratorsNames.length === 0) {
        getInstanceGeneratorNamesAndFillCombos();
    }
    refreshTable();
});

/*
 * --------------------------------- TRANSFORMATION TAB ----------------------------------
 */
/*
 * Handler fired when user runs x3ml engine
 */
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
