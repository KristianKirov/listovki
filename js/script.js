var TemplateEngine = function(html, options) {
    var re = /<%([^%>]+)?%>/g, reExp = /(^( )?(if|for|else|switch|case|break|{|}))(.*)?/g, code = 'var r=[];\n', cursor = 0, match;
    var add = function(line, js) {
        js? (code += line.match(reExp) ? line + '\n' : 'r.push(' + line + ');\n') :
            (code += line != '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '');
        return add;
    }
    while(match = re.exec(html)) {
        add(html.slice(cursor, match.index))(match[1], true);
        cursor = match.index + match[0].length;
    }
    add(html.substr(cursor, html.length - cursor));
    code += 'return r.join("");';
    return new Function(code.replace(/[\r\t\n]/g, '')).apply(options);
}

function renderTemplate(templateId, data) {
    var templateHtml = $('#' + templateId).html();

    return TemplateEngine(templateHtml, data);
}

$.getJSON('topics.json', function(d) {
    d.questionsCount = 0;
    var promises = [];
    for(var index in d.topics) {
        var topic = d.topics[index];
        topic.questionsCount = 0;
        for(var index2 in topic.subTopics) {
            var subTopic = topic.subTopics[index2];
            d.questionsCount += subTopic.questionsCount;
            topic.questionsCount += subTopic.questionsCount;
            (function (subTopic) {
                var p = $.getJSON('questions/' + subTopic.id + '.json', function(q) {
                    if (q.length != subTopic.questionsCount) throw new Error('Questions count missmatch');
                    subTopic.questions = q;
                });
                promises.push(p);
            })(subTopic);
        }
    }

    $.when.apply($, promises).then(function() {
        $('#output').html(renderTemplate('template-all', d));
        $('#toggleCorrect').change(function () {
            var type = this.checked ? 'text/css' : 'text/no-css';
            $('#toggle-css').attr('type', type);
        });

        $('.tbl--questions td').click(function() {
            var clickedCell = this;
            if (this.classList.contains('ans--correct')) {
                this.classList.add('correct-answer');
            }
            else if (this.classList.contains('ans--wrong')) {
                this.classList.add('wrong-answer');
            }
        });
    });
});